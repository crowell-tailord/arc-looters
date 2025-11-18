import { parse } from 'node-html-parser';
import fs from 'fs';
import path from 'path';

const TARGET_URL = 'https://arcraiders.wiki/wiki/Loot';
const OUTPUT_PATH = path.resolve('./src/data/loot.json');

const sanitize = (value) =>
  value
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseNumericValue = (value) => {
  const cleaned = sanitize(value || '').replace(/[^\d.-]+/g, '');
  return cleaned ? Number(cleaned) : 0;
};

const splitParts = (cellText) => {
  const tokens = cellText
    .split(/[•\n;,]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return tokens.map((token) => {
    const match = token.match(/^(\d+)x?\s+(.*)$/i);
    return match
      ? { quantity: Number(match[1]), name: sanitize(match[2]) }
      : { quantity: 1, name: sanitize(token) };
  });
};

const parseParts = (cell) => {
  if (!cell) return [];

  const segments = [];
  let buffer = '';

  const flush = () => {
    const value = sanitize(buffer);
    if (value) segments.push(value);
    buffer = '';
  };

  const walk = (node) => {
    if (!node) return;
    const tag = typeof node.tagName === 'string' ? node.tagName.toLowerCase() : null;

    if (tag === 'br') {
      flush();
      return;
    }

    if (tag === 'li') {
      node.childNodes.forEach(walk);
      flush();
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      node.childNodes.forEach(walk);
      return;
    }

    buffer += node.rawText ?? node.text ?? '';
  };

  cell.childNodes.forEach(walk);
  flush();

  return segments.flatMap((segment) => splitParts(segment));
};

const parseKeepForQuestWorkshop = (cell) => {
  if (!cell) return [];

  const entries = [];
  let buffer = '';

  const flush = () => {
    const value = sanitize(buffer);
    if (value) entries.push(value);
    buffer = '';
  };

  const walk = (node) => {
    if (!node) return;
    const tag = typeof node.tagName === 'string' ? node.tagName.toLowerCase() : null;
    if (tag === 'br') {
      flush();
      return;
    }

    if (tag === 'li') {
      node.childNodes.forEach(walk);
      flush();
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      node.childNodes.forEach(walk);
      return;
    }

    buffer += node.rawText ?? node.text ?? '';
  };

  cell.childNodes.forEach(walk);
  flush();

  return entries;
};

const findColumn = (headers, predicate) => {
  const lower = predicate.toLowerCase();
  return headers.findIndex((value) => value.toLowerCase().includes(lower));
};

const resolveImageHref = (img) => {
  if (!img) return '';

  const candidates = [
    img.getAttribute('data-src'),
    img.getAttribute('data-srcset')?.split(/\s+/)[0],
    img.getAttribute('data-lazy-src'),
    img.getAttribute('data-original'),
    img.getAttribute('src')
  ];

  let source = candidates.find((value) => value && value !== 'none');
  if (!source) return '';

  source = source.trim();
  if (source.startsWith('//')) {
    source = `https:${source}`;
  } else if (source.startsWith('/')) {
    source = new URL(source, TARGET_URL).href;
  }

  return source;
};

const getItemPageUrl = (row) => {
  const anchor = row.querySelector('a[href*="/wiki/"]');
  if (!anchor) return '';
  const href = anchor.getAttribute('href');
  if (!href) return '';
  if (href.startsWith('http')) return href;
  return new URL(href, TARGET_URL).href;
};

const fetchPageImage = async (pageUrl) => {
  if (!pageUrl) return '';

  try {
    const res = await fetch(pageUrl);
    if (!res.ok) return '';
    const html = await res.text();
    const root = parse(html);
    const metaImage = root.querySelector('meta[property="og:image"]');
    const ogImage = metaImage ? metaImage.getAttribute('content') : '';
    if (ogImage) return ogImage;

    const infoboxImage = resolveImageHref(root.querySelector('.infobox .image img'));
    if (infoboxImage) return infoboxImage;

    return resolveImageHref(root.querySelector('a.image img'));
  } catch {
    return '';
  }
};

const enrichImages = async (loot) => {
  for (const item of loot) {
    if (item.image) continue;
    if (!item.pageUrl) continue;
    const pageImage = await fetchPageImage(item.pageUrl);
    if (pageImage) {
      item.image = pageImage;
    }
  }
};

const buildFilePathUrl = (href) => {
  if (!href) return '';
  const fileMatch = href.match(/\/wiki\/(File:.+)$/i);
  if (!fileMatch) return '';
  const fileName = fileMatch[1];
  return `https://arcraiders.wiki/wiki/Special:FilePath/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`;
};

const parseRow = (row, headers) => {
  const cells = row.querySelectorAll('td');
  if (!cells.length) return null;

  const cellText = cells.map((cell) => sanitize(cell.text));
  const getCell = (key) => {
    const idx = findColumn(headers, key);
    return idx >= 0 ? cellText[idx] : '';
  };
  const getCellElement = (key) => {
    const idx = findColumn(headers, key);
    return idx >= 0 ? cells[idx] : null;
  };

  const name = getCell('name') || getCell('item');
  if (!name) return null;

  const rarity = getCell('rarity');
  const valueText = getCell('sell price') || getCell('sell value') || getCell('value') || '';
  const value = parseNumericValue(valueText);
  const description = getCell('description') || '';
  const partsCell = getCellElement('parts') || getCellElement('recycle');
  const parts = parseParts(partsCell);
  const category = sanitize(getCellElement('category')?.text || '');
  const keepForQuestsWorkshop = parseKeepForQuestWorkshop(getCellElement('keep for quest'));

  const imageTag = row.querySelector('img');
  let image = resolveImageHref(imageTag);

  if (!image) {
    const fileLink = row.querySelector('a.image')?.getAttribute('href');
    image = buildFilePathUrl(fileLink);
  }

  const pageUrl = getItemPageUrl(row);
  return {
    name,
    rarity,
    value,
    description,
    parts,
    category,
    keepForQuestsWorkshop,
    image,
    pageUrl
  };
};

const run = async () => {
  console.log(`Fetching ${TARGET_URL}`);
  const res = await fetch(TARGET_URL);
  if (!res.ok) {
    throw new Error(`Fetch failed with ${res.status}`);
  }

  const html = await res.text();
  const root = parse(html);
  const tables = root.querySelectorAll('table.wikitable');

  if (!tables.length) {
    throw new Error('Could not locate any wikitable on the Loot page.');
  }

  const loot = [];

  tables.forEach((table) => {
    const headerRow = table.querySelector('tr');
    if (!headerRow) return;

    const headers = headerRow
      .querySelectorAll('th')
      .map((th) => sanitize(th.text));

    table.querySelectorAll('tr').forEach((row, rowIndex) => {
      if (rowIndex === 0) return;
      const parsed = parseRow(row, headers);
      if (parsed) loot.push(parsed);
    });
  });

  if (!loot.length) {
    throw new Error('No loot rows were parsed from the tables.');
  }

  await enrichImages(loot);
  loot.forEach((entry) => {
    delete entry.pageUrl;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(loot, null, 2));
  console.log(`Wrote ${loot.length} entries to ${path.relative(process.cwd(), OUTPUT_PATH)}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
