import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

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

export function isRunningWalkingOrCyclingActivity(title = '') {
  if (!title) return false;
  const text = String(title).toLowerCase();
  const rx = /\b(?:run\w*|jog\w*|walk\w*|hike\w*|trek\w*|cycl\w*|bike\w*|bicycl\w*|ride\w*|step\w*|move\w*)\b/;
  return rx.test(text);
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
      } catch { }
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

    if (isRunningWalkingOrCyclingActivity(title)) {
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
  }

  return out;
}

export async function scrapeNparksEvents(maxPages = null) {
  const BASE = 'https://www.nparks.gov.sg';
  const START_URL = `${BASE}/visit/events`;
  const EVENT_LIST_URL = `${BASE}/visit/events/EventList/`;
  const UA_STR =
    typeof UA === 'string' && UA
      ? UA
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

  const ABS = (u) => {
    if (!u) return '';
    try { return new URL(u, BASE).toString(); } catch { return u; }
  };

  const decodeFragment = (raw) => {
    const t = (raw || '').trim();
    const looksJsonString = (t.startsWith('"') && t.endsWith('"')) || /\\u003c/i.test(t);
    if (looksJsonString) {
      try {
        const decoded = JSON.parse(t);
        return decoded;
      } catch (e) {
        console.warn('[nparks] JSON.parse failed for fragment, using raw. err=', e?.message);
      }
    }
    return raw;
  };

  const items = [];
  const collectFrom = ($root, tag = 'page') => {
    const sel = '.card-listing .event-card';
    const nodes = $root(sel);

    const before = items.length;
    nodes.each((_, el) => {
      const card = $root(el);
      const a = card.find('.event-card-bottom a.event-card-title').first();
      const title = (a.text() || '').trim();
      const href = ABS(a.attr('href'));
      const imgUrl = ABS(card.find('.event-card-top img').attr('src'));
      const feeRaw = (card.find('.event-card-type-cost p span').first().text() || '').trim();
      const fee = feeRaw || 'Free';

      let dateTime = '';
      const particulars = card.find('.event-card-particular').first();
      if (particulars.length) {
        const raw = particulars.html() || '';
        dateTime = raw.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
      }

      const description = (card.find('.event-card-bottom > p').first().text() || '').trim();

      if (isRunningWalkingOrCyclingActivity(title)) {
        items.push(normalize({
          title,
          description,
          dateTime,
          imgUrl,
          href,
          fee,
          source: 'nparks',
        }))
      }
    });
  };

  // Touch main page for referer/cookies
  const res = await fetch(START_URL, { headers: { 'user-agent': UA_STR } });
  const cookie = res.headers.get('set-cookie') || '';
  const firstHtml = await res.text();

  // Page 1 via AJAX (server defaults to page 1)
  const post1 = await fetch(EVENT_LIST_URL, {
    method: 'POST',
    headers: {
      'user-agent': UA_STR,
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'accept': 'text/html, */*; q=0.1',
      'accept-language': 'en-US,en;q=0.9',
      'x-requested-with': 'XMLHttpRequest',
      'origin': BASE,
      'referer': START_URL,
      ...(cookie ? { cookie } : {}),
    },
    body: new URLSearchParams({
      searchQuery: '',
      DateFrom: '',
      DateTo: '',
      DateType: 'time-anytime',
      FreePrice: 'false',
      SelectedOpenRegistration: 'false',
      currentPage: '1',
    }),
  });

  let frag1 = await post1.text();
  frag1 = decodeFragment(frag1);

  const $p1 = cheerio.load(frag1);
  collectFrom($p1, 'AJAX p1');

  // Total pages from the decoded fragment
  let totalPages = 1;
  $p1('.card-listing-pagination [data-pagerindex]').each((_, li) => {
    const n = parseInt($p1(li).attr('data-pagerindex'), 10);
    if (!isNaN(n)) totalPages = Math.max(totalPages, n);
  });
  if (Number.isFinite(maxPages) && maxPages > 0) totalPages = Math.min(totalPages, maxPages);
  console.log('[nparks] totalPages detected:', totalPages);

  // Remaining pages
  for (let page = 2; page <= totalPages; page++) {
    console.log(`[nparks] POST page=${page} -> EventList/`);
    const resp = await fetch(EVENT_LIST_URL, {
      method: 'POST',
      headers: {
        'user-agent': UA_STR,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'accept': 'text/html, */*; q=0.1',
        'accept-language': 'en-US,en;q=0.9',
        'x-requested-with': 'XMLHttpRequest',
        'origin': BASE,
        'referer': START_URL,
        ...(cookie ? { cookie } : {}),
      },
      body: new URLSearchParams({
        searchQuery: '',
        DateFrom: '',
        DateTo: '',
        DateType: 'time-anytime',
        FreePrice: 'false',
        SelectedOpenRegistration: 'false',
        currentPage: String(page),
      }),
    });

    let snippet = await resp.text();
    snippet = decodeFragment(snippet);

    const $p = cheerio.load(snippet);
    collectFrom($p, `AJAX p${page}`);
  }

  if (items.length) console.log('[nparks] sample item:', items[0]);
  else console.warn('[nparks] WARNING: no items collected.');

  return items;
}

export async function scrapeActiveSGCircleEvents({
  dateMs = Date.now(),
  types = ['Races', 'Runs'],
  filter = 'All',
  headless = true,
} = {}) {
  const BASE = 'https://www.activesgcircle.gov.sg';
  const url =
    `${BASE}/things-to-do/events` +
    `?date=${dateMs}&filter=${encodeURIComponent(filter)}` +
    `&type=${encodeURIComponent(types.join(','))}&s=`;

  let browser;
  try {
    browser = await puppeteer.launch({ headless });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for the container to exist, then for cards to be injected.
    await page.waitForSelector('#oneDay', { timeout: 20000 });
    await page.waitForFunction(
      () => document.querySelectorAll('#oneDay .outerDiv').length > 0,
      { timeout: 25000 }
    );

    const items = await page.evaluate((BASE) => {
      const ABS = (u) => {
        try { return new URL(u, BASE).href; } catch { return u || ''; }
      };
      const getText = (el, sel) =>
        (el.querySelector(sel)?.textContent || '').trim();

      // Add year if missing: prefer Google/Outlook calendar links, then hidden epoch, then year in title.
      const addYear = (row, title, dateText) => {
        if (!dateText) return dateText;

        // If date already has a year, return as-is.
        if (/\b20\d{2}\b/.test(dateText)) return dateText;

        // 1) Try Google calendar link (dates=YYYYMMDD…)
        let year = '';
        const gHref = row.querySelector('.google-calendar')?.getAttribute('href') || '';
        const mG = gHref.match(/dates=(\d{4})\d{4}/i);
        if (mG) year = mG[1];

        // 2) Try Outlook link (startdt=YYYY-…)
        if (!year) {
          const oHref = row.querySelector('.outlook-calendar')?.getAttribute('href') || '';
          const mO = oHref.match(/startdt=(\d{4})-/i);
          if (mO) year = mO[1];
        }

        // 3) Try hidden epoch timestamp (child span under .cal-right)
        if (!year) {
          const tsRaw = (row.querySelector('.cal-right.right > span[style*="display:none"]')?.textContent || '').trim();
          const tsNum = parseInt(tsRaw, 10);
          if (!Number.isNaN(tsNum) && tsRaw.length >= 12) {
            const d = new Date(tsNum);
            year = String(d.getFullYear());
          }
        }

        // 4) Try year in title (e.g., "... 2025")
        if (!year) {
          const mT = (title || '').match(/\b(20\d{2})\b/);
          if (mT) year = mT[1];
        }

        if (!year) return dateText;

        // Insert year per segment. For ranges, add year to both sides.
        if (dateText.includes('-')) {
          return dateText.replace(/\b(\d{1,2}\s+\w{3})\b/g, `$1 ${year}`);
        }
        return `${dateText} ${year}`;
      };

      const cards = Array.from(document.querySelectorAll('#oneDay .outerDiv'));
      const out = [];

      for (constwrap of cards) {
        const row = constwrap.querySelector('.cal_item-row') || constwrap;

        const title = getText(row, '.cal-title');
        const description = getText(row, '.more-info-wrap .desc');
        const imgUrl = row.querySelector('.img img')?.getAttribute('src') || '';

        // Dates: single-day vs multi-day
        let dateText = '';
        const single = getText(row, '.common-date .date b'); // e.g. "02 Nov"
        if (single) {
          dateText = single;
        } else {
          const sDate = getText(row, '.date-wrap .sDate b') || getText(row, '.date-wrap .sDate .b-date b');
          const eDate = getText(row, '.date-wrap .eDate b') || getText(row, '.date-wrap .eDate .b-date b');
          if (sDate && eDate) {
            dateText = `${sDate} - ${eDate}`;
          } else if (sDate) {
            dateText = sDate;
          }
        }

        // Time (if present)
        const timeText = getText(row, '.time').replace(/\s+/g, ' ').trim();
        let dateTime = addYear(row, title, dateText);
        if (timeText) dateTime = `${dateTime} ${timeText}`.trim();

        const a = row.querySelector('.read-more-wrap a.read-more, .read-more-wrap a.thingstodo-listing-btn') || row.querySelector('a.thingstodo-listing-btn');
        const href = ABS(a?.getAttribute('href') || '');

        out.push({
          title,
          description,
          dateTime,
          imgUrl,
          href,
          fee: 'Click for more info',
          source: 'activesg',
        });
      }

      return out;
    }, BASE);

    return items.map(normalize);
  } finally {
    if (browser) await browser.close();
  }
}

export function settledToArray(res, label) {
  if (res.status === 'fulfilled') {
    if (Array.isArray(res.value)) return res.value;
    console.warn(`[scrape] ${label} returned non-array, coercing to []`);
    return [];
  } else {
    console.error(`[scrape] ${label} failed:`, res.reason);
    return [];
  }
};
