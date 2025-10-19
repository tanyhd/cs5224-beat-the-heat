import axios from 'axios';
import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

const ABS = (url, base) => {
  if (!url) return '';
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
};

async function fetchText(url, init = {}, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
        ...init,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

function normalize({
  title = '',
  description = '',
  dateTime = '',
  imgUrl = '',
  href = '',
  fee = '',
  source = '',
}) {
  const normFee = (fee || '').toString().trim() || 'Free';
  return {
    title: (title || '').toString().trim(),
    description: (description || '').toString().trim(),
    dateTime: (dateTime || '').toString().trim(),
    imgUrl: (imgUrl || '').toString().trim(),
    href: (href || '').toString().trim(),
    fee: normFee,
    source,
  };
}

export async function scrapeHealthHubProgrammes() {
  const BASE = 'https://www.healthhub.sg';
  const PAGE = `${BASE}/programmes`;

  // 1) Fetch page and locate the "All Programmes" search-results component.
  const html = await fetchText(PAGE);
  const $ = cheerio.load(html);

  let propsJson = null;
  $('.component.search-results[data-properties]').each((_, el) => {
    const raw = $(el).attr('data-properties') || '';
    try {
      const props = JSON.parse(raw);
      if (props.sig === 'healthprogramme') propsJson = props;
    } catch {
      // attributes are usually already decoded; if not, try to unescape quotes
      try {
        const repaired = raw.replace(/&quot;/g, '"');
        const props = JSON.parse(repaired);
        if (props.sig === 'healthprogramme') propsJson = props;
      } catch {}
    }
  });

  if (!propsJson) {
    throw new Error('Could not find HealthHub "All Programmes" component props.');
  }

  // 2) Call their JSON endpoint but increase p (page size) to pull all results at once.
  const qs = new URLSearchParams({
    v: propsJson.v,
    s: propsJson.s,
    l: propsJson.l || '',
    p: String(100), // large enough to cover all
    sig: propsJson.sig,
    itemid: propsJson.itemid,
  });

  const endpoint =
    (propsJson.endpoint || `${BASE}/sxa/search/results/`).replace(/\/+$/, '') +
    '/?' +
    qs.toString();

  const jsonTxt = await fetchText(endpoint);
  let data;
  try {
    data = JSON.parse(jsonTxt);
  } catch (e) {
    throw new Error('Unexpected JSON from HealthHub endpoint');
  }

  const results = Array.isArray(data.Results) ? data.Results : [];
  const out = [];

  for (const r of results) {
    // Prefer the structured Url/Name; fall back to parsing Html fragment.
    let title = (r.Name || '').trim();
    let href = ABS(r.Url || '', BASE);
    let imgUrl = '';
    let description = '';

    if ((!title || !href || !imgUrl || !description) && r.Html) {
      const $frag = cheerio.load(r.Html);
      if (!title) {
        title =
          $frag('.card-title').first().text().trim() ||
          $frag('a').first().text().trim() ||
          title;
      }
      if (!href) {
        const a =
          $frag('a[href^="/programmes/"]').first().attr('href') ||
          $frag('a[href]').first().attr('href');
        href = ABS(a, BASE);
      }
      imgUrl =
        ABS($frag('img').first().attr('src'), BASE) ||
        ABS($frag('img').first().attr('thumbnailsrc'), BASE) ||
        imgUrl;
      description =
        $frag('.card-content').first().text().trim() ||
        $frag('p').first().text().trim() ||
        '';
    }

    out.push(
      normalize({
        title,
        description,
        dateTime: '', // HH programmes page doesn't expose this
        imgUrl,
        href,
        fee: 'Free', // default as requested
        source: 'healthhub',
      })
    );
  }

  return out;
}
