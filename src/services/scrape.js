import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeHealthHubProgrammes() {
  console.log("[S0] START scrapeHealthHubProgrammes");
  const pageUrl = "https://www.healthhub.sg/programmes";

  // 1) Load page & find All Programmes props
  const res = await axios.get(pageUrl, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "en-SG,en;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
    validateStatus: () => true,
  });
  const $ = cheerio.load(String(res.data || ""));
  let props = null;
  $("main .component.search-results").each((_, el) => {
    const raw = $(el).attr("data-properties") || "";
    const p = safeParseProps(raw);
    if (p?.sig === "healthprogramme") props = p;
  });
  if (!props) {
    console.log("[S2] All Programmes block not found");
    return [];
  }
  console.log("[S2] Found All Programmes props:", props);

  // 2) First call (small p) just to get Count
  const firstUrl = buildEndpointUrl(props); // uses original p (9)
  const first = await callSxa(firstUrl, pageUrl);
  const total = Number(first?.Count || 0);
  const needSecondCall = Array.isArray(first?.Results) && first.Results.length < total;

  // 3) If needed, call again with p=Count (fetch all in one go)
  const data = needSecondCall
    ? await callSxa(buildEndpointUrl({ ...props, p: total }), pageUrl)
    : first;

  const results = Array.isArray(data?.Results) ? data.Results : [];
  console.log(`[S3] Count=${total} | Results length=${results.length}`);

  // 4) Parse each card's Html
  const out = [];
  const seen = new Set();
  for (const r of results) {
    const html = r?.Html || "";
    if (!html) continue;
    const $$ = cheerio.load(html);

    const $a = $$("a").first();
    const href = absUrl($a.attr("href") || "", "https://www.healthhub.sg/");
    const title = clean($$("h5.card-title").first().text());
    const description = clean($$("p.card-content").first().text());
    const $img = $$("img").first();
    const imageUrl = absUrl($img.attr("src") || "", href);
    const imageAlt = clean($img.attr("alt") || "");

    if (href && title && !seen.has(href)) {
      out.push({ section: "All Programmes", url: href, title, description, imageUrl, imageAlt });
      seen.add(href);
      console.log(`[S4] + ${title} | ${href}`);
    }
  }

  console.log(`[S5] DONE. collected=${out.length} (API Count=${total})`);
  return out;
}

/* helpers */
function safeParseProps(s) {
  if (!s) return null;
  try {
    const o = JSON.parse(s.replace(/&quot;/g, '"'));
    return {
      endpoint: o?.endpoint,
      sig: o?.sig,
      v: o?.v,
      s: o?.s,
      l: o?.l ?? "",
      p: o?.p ?? 9,
      itemid: o?.itemid,
    };
  } catch {
    return null;
  }
}
function buildEndpointUrl(props) {
  const params = new URLSearchParams({
    v: props.v || "",
    s: props.s || "",
    l: props.l ?? "",
    p: String(props.p ?? 9),
    sig: props.sig || "",
    itemid: props.itemid || "",
  });
  return `${props.endpoint}?${params.toString()}`;
}
async function callSxa(url, referer) {
  const r = await axios.get(url, {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      Referer: referer,
      Accept: "application/json,text/html,*/*",
    },
    validateStatus: () => true,
  });
  return r.data || {};
}
function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
function absUrl(href, base) { try { return href ? new URL(href, base).toString() : ""; } catch { return href || ""; } }