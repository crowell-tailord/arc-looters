import { parse } from 'node-html-parser';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://arcraiders.wiki';
const TARGET_URL = `${BASE_URL}/wiki/Loot`;
const API_URL = `${BASE_URL}/w/api.php`;
const OUTPUT_PATH = path.resolve('./src/data/loot.json');
const ADJUSTMENTS_PATH = path.resolve('./src/data/loot-adjustments.json');

const sanitize = (value) =>
  value
    .replace(/[\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const logProgress = (label, current, total) => {
  if (!total) return;
  const line = `${label} ${current}/${total}`;
  if (current < total) {
    process.stdout.write(`\r${line}`);
  } else {
    process.stdout.write(`\r${line}\n`);
  }
};

const getClassList = (node) =>
  (node?.getAttribute?.('class') || '')
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

const hasClass = (node, target) =>
  getClassList(node).some((value) => value.toLowerCase() === target.toLowerCase());

const normalizeName = (value) => sanitize(value.replace(/_/g, ' '));
const getTargetNameFromArgs = () => {
  const arg = process.argv.slice(2).join(' ').trim();
  return arg ? normalizeName(arg) : '';
};

const parseNumericValue = (value) => {
  const text = sanitize(value || '');
  const match = text.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
  if (!match) return 0;
  const cleaned = match[0].replace(/,/g, '');
  return Number(cleaned);
};

const normalizeRarity = (value) => {
  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const lower = (value || '').toLowerCase();
  const match = rarities.find((rarity) => lower.includes(rarity));
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : '';
};

const splitParts = (cellText) => {
  const tokens = cellText
    .split(/[•\n;,]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return tokens.map((token) => {
    const match = token.match(/^(\d+)\s*(?:x|×)\s+(.*)$/i);
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

    if (tag === 'style' || tag === 'script') {
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

const findSectionAfterAnchor = (root, ids) => {
  const selectors = ids.map((id) => `#${id}`).join(', ');
  const anchor = root.querySelector(selectors);
  if (!anchor) return null;

  const findSection = () => {
    let cursor = anchor;
    while (cursor) {
      let sibling = cursor.nextElementSibling;
      while (sibling) {
        if (sibling.tagName?.toLowerCase() === 'section') {
          return sibling;
        }
        const innerSection = sibling.querySelector('section');
        if (innerSection) {
          return innerSection;
        }
        sibling = sibling.nextElementSibling;
      }
      cursor = cursor.parentElement;
    }
    return null;
  };

  return findSection();
};

const parseInfoboxSegments = (cell) => {
  if (!cell) return [];

  const segments = [];
  let buffer = '';

  const flush = () => {
    const value = sanitize(buffer);
    if (!value) {
      buffer = '';
      return;
    }

    value
      .split(/[•\n;]+/)
      .map((segment) => sanitize(segment))
      .filter(Boolean)
      .forEach((segment) => segments.push(segment));

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

  return segments;
};

const parseInfoboxDetails = (root) => {
  const data = {};
  const infobox = root.querySelector('.infobox');
  if (!infobox) return data;

  const title = sanitize(infobox.querySelector('.infobox-title')?.text || '');
  if (title) {
    data.name = title;
  }

  const tags = [];

  infobox.querySelectorAll('tr').forEach((row) => {
    if (hasClass(row, 'infobox-quote') || hasClass(row, 'data-quote')) {
      const quote = sanitize(row.text);
      if (quote) {
        data.description = data.description || quote;
      }
      return;
    }

    if (hasClass(row, 'data-tag')) {
      const tagText = sanitize(row.text);
      if (tagText) tags.push(tagText);

      const classRarity = getClassList(row).map((value) => normalizeRarity(value)).find(Boolean);
      const rarity = normalizeRarity(tagText) || classRarity;
      if (!data.rarity && rarity) {
        data.rarity = rarity;
      }
      return;
    }

    if (hasClass(row, 'data-weight')) {
      const weightDiv = row.querySelector('.template-weight');
      if (weightDiv) {
        data.weight = sanitize(weightDiv.text);
      }
      return;
    }

    const header = row.querySelector('th');
    const valueCell = row.querySelector('td');
    if (!header || !valueCell) return;

    const label = sanitize(header.text).toLowerCase();
    if (!label) return;

    const segments = parseInfoboxSegments(valueCell);
    if (!segments.length) return;

    if (!data.sources && label.includes('source')) {
      data.sources = segments;
      return;
    }

    if (!data.canBeFoundIn && (label.includes('can be found in') || label.includes('found in'))) {
      data.canBeFoundIn = segments;
      return;
    }

    if (!data.weight && label.includes('weight')) {
      data.weight = segments[0];
      return;
    }

    if (!data.stackSize && label.includes('stack size')) {
      data.stackSize = segments[0];
      return;
    }

    if (!data.value && (label.includes('sell price') || label.includes('sell value') || label === 'value')) {
      data.value = parseNumericValue(segments[0]);
      return;
    }
  });

  if (!data.category && tags.length) {
    const category = tags.find((tag) => !normalizeRarity(tag));
    if (category) {
      data.category = category;
    }
  }

  return data;
};

const parseSourcesSection = (root) => {
  const section = findSectionAfterAnchor(root, ['Sources', 'sources']);
  if (!section) return [];

  const list = section.querySelector('ul, ol');
  const entries = [];

  if (list) {
    list.querySelectorAll('li').forEach((li) => {
      const value = sanitize(li.text);
      if (value) entries.push(value);
    });
  }

  if (!entries.length) {
    const fallback = sanitize(section.text);
    if (fallback) entries.push(fallback);
  }

  return entries;
};

const parseQuestSection = (root) => {
  const section = findSectionAfterAnchor(root, ['Quest', 'Quests']);
  if (!section) return [];

  const firstCell = section.querySelector('td');
  return parseKeepForQuestWorkshop(firstCell);
};

const parseRecycledMaterials = (root, itemName) => {
  const tables = root.querySelectorAll('table.wikitable');
  const normalizedTarget = sanitize(itemName || '').toLowerCase();

  for (const table of tables) {
    const headerRow = table.querySelector('tr');
    if (!headerRow) continue;

    const headers = headerRow
      .querySelectorAll('th')
      .map((th) => sanitize(th.text));

    const recyclingIdx = headers.findIndex((value) => value.toLowerCase().includes('recycling'));
    const salvagingIdx = headers.findIndex((value) => value.toLowerCase().includes('salvaging'));

    if (recyclingIdx === -1 && salvagingIdx === -1) continue;

    const rows = table.querySelectorAll('tr');
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      if (!cells.length) continue;

      const subject = sanitize(cells[0]?.text || '').toLowerCase();
      if (normalizedTarget && subject && subject !== normalizedTarget) continue;

      const recycling = recyclingIdx >= 0 ? parseParts(cells[recyclingIdx]) : [];
      const salvaging = salvagingIdx >= 0 ? parseParts(cells[salvagingIdx]) : [];

      if (recycling.length) return recycling;
      if (salvaging.length) return salvaging;
    }
  }

  return [];
};

const getItemPageUrl = (row) => {
  const anchor = row.querySelector('a[href*="/wiki/"]');
  if (!anchor) return '';
  const href = anchor.getAttribute('href');
  if (!href) return '';
  if (href.startsWith('http')) return href;
  return new URL(href, TARGET_URL).href;
};

const fetchPageDetails = async (pageUrl) => {
  if (!pageUrl) return {};

  try {
    const res = await fetch(pageUrl);
    if (!res.ok) return {};
    const html = await res.text();
    const root = parse(html);
    const infoboxData = parseInfoboxDetails(root);
    const sectionSources = parseSourcesSection(root);
    const questRequirements = parseQuestSection(root);
    const recycledParts = parseRecycledMaterials(root, infoboxData.name);
    const mergedSources = [...new Set([...(infoboxData.sources || []), ...sectionSources])];
    const pageData = { ...infoboxData };
    if (mergedSources.length) {
      pageData.sources = mergedSources;
    } else {
      delete pageData.sources;
    }
    if (questRequirements.length) {
      pageData.keepForQuestsWorkshop = questRequirements;
    }
    if (recycledParts.length) {
      pageData.parts = recycledParts;
    }
    const metaImage = root.querySelector('meta[property="og:image"]');
    const ogImage = metaImage ? metaImage.getAttribute('content') : '';
    if (ogImage) {
      return { image: ogImage, ...pageData };
    }

    const infoboxImage = resolveImageHref(root.querySelector('.infobox .image img'));
    if (infoboxImage) {
      return { image: infoboxImage, ...pageData };
    }

    return {
      image: resolveImageHref(root.querySelector('a.image img')),
      ...pageData
    };
  } catch {
    return {};
  }
};

const enrichImages = async (loot) => {
  const itemsWithPage = loot.filter((item) => item.pageUrl);
  let processed = 0;

  for (const item of itemsWithPage) {
    processed += 1;
    logProgress('Enriching pages', processed, itemsWithPage.length);

    const details = await fetchPageDetails(item.pageUrl);
    if (details.name && !item.name) {
      item.name = details.name;
    }
    if (details.description && !item.description) {
      item.description = details.description;
    }
    if (details.rarity && !item.rarity) {
      item.rarity = details.rarity;
    }
    if (details.category && !item.category) {
      item.category = details.category;
    }
    if (details.value && (!item.value || item.value === 0)) {
      item.value = details.value;
    }
    if (details.parts?.length && (!item.parts || !item.parts.length)) {
      item.parts = details.parts;
    }
    if (details.image && !item.image) {
      item.image = details.image;
    }
    if (details.sources?.length) {
      item.sources = details.sources;
    }
    if (details.canBeFoundIn?.length) {
      item.canBeFoundIn = details.canBeFoundIn;
    }
    if (details.keepForQuestsWorkshop?.length && (!item.keepForQuestsWorkshop || !item.keepForQuestsWorkshop.length)) {
      item.keepForQuestsWorkshop = details.keepForQuestsWorkshop;
    }
    if (details.weight) {
      item.weight = details.weight;
    }
    if (details.stackSize) {
      item.stackSize = details.stackSize;
    }
  }
};

const addLocalImageProperty = (loot) => {
  loot.forEach((item) => {
    if (!item.image) {
      delete item.localImage;
      return;
    }

    try {
      const imageUrl = new URL(item.image);
      const fileName = decodeURIComponent(path.basename(imageUrl.pathname));
      if (fileName) {
        item.localImage = fileName;
      } else {
        delete item.localImage;
      }
    } catch {
      delete item.localImage;
    }
  });
};

const createLootKey = (name) => normalizeName(name || '').toLowerCase();

const buildFilePathUrl = (href) => {
  if (!href) return '';
  const fileMatch = href.match(/\/wiki\/(File:.+)$/i);
  if (!fileMatch) return '';
  const fileName = fileMatch[1];
  return `https://arcraiders.wiki/wiki/Special:FilePath/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`;
};

const loadLootAdjustments = () => {
  try {
    const data = fs.readFileSync(ADJUSTMENTS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const applyLootAdjustments = (loot, adjustments) => {
  if (!Array.isArray(adjustments) || !adjustments.length) return;

  const lootByKey = new Map(loot.map((item) => [createLootKey(item.name), item]));
  let applied = 0;

  adjustments.forEach((adjustment) => {
    if (!adjustment?.name) return;
    const { name, editType = 'replace', ...edits } = adjustment;
    if (editType !== 'replace') return;

    const key = createLootKey(name);
    const target = lootByKey.get(key);
    if (!target) return;

    Object.entries(edits).forEach(([field, value]) => {
      target[field] = value;
    });
    applied += 1;
  });

  if (applied) {
    console.log(
      `Applied ${applied} adjustment${applied === 1 ? '' : 's'} from ${path.relative(process.cwd(), ADJUSTMENTS_PATH)}`
    );
  }
};

const fetchInfoboxItemPages = async () => {
  const pages = [];
  let eicontinue;

  try {
    do {
      const params = new URLSearchParams({
        action: 'query',
        list: 'embeddedin',
        eititle: 'Template:Infobox_item',
        einamespace: '0',
        eilimit: 'max',
        format: 'json',
        origin: '*'
      });

      if (eicontinue) {
        params.set('eicontinue', eicontinue);
      }

      const res = await fetch(`${API_URL}?${params.toString()}`);
      if (!res.ok) break;
      const payload = await res.json();
      pages.push(...(payload?.query?.embeddedin || []));
      eicontinue = payload?.continue?.eicontinue;
    } while (eicontinue);
  } catch {
    return [];
  }

  return pages
    .map(({ title }) => title)
    .filter(Boolean)
    .map((title) => ({
      title,
      pageUrl: new URL(`/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`, BASE_URL).href
    }));
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
  const targetName = getTargetNameFromArgs();

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

  const lootByName = new Map(loot.map((item) => [createLootKey(item.name), item]));
  const infoboxPages = await fetchInfoboxItemPages();
  console.log(`Discovered ${infoboxPages.length} pages using Infobox_item template`);

  infoboxPages.forEach(({ title, pageUrl }) => {
    const key = createLootKey(title);
    if (lootByName.has(key)) return;
    const entry = { name: normalizeName(title), pageUrl };
    loot.push(entry);
    lootByName.set(key, entry);
  });

  if (targetName) {
    const targetKey = createLootKey(targetName);
    const filtered = loot.filter((item) => createLootKey(item.name) === targetKey);
    if (!filtered.length) {
      throw new Error(`Requested item '${targetName}' not found from Loot page or Infobox_item pages.`);
    }
    loot.length = 0;
    loot.push(...filtered);
    console.log(`Filtered to requested item: ${filtered[0].name}`);
  }

  if (!loot.length) {
    throw new Error('No loot rows were parsed from the tables.');
  }

  await enrichImages(loot);
  applyLootAdjustments(loot, loadLootAdjustments());
  addLocalImageProperty(loot);
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
