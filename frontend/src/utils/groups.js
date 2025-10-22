export function toCategory(sample) {
  return (sample?.category || 'Uncategorized');
}

export function groupSamplesByCategory(samples = []) {
  const byCat = new Map();
  for (const s of samples) {
    const cat = toCategory(s);
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(s);
  }
  const entries = Array.from(byCat.entries()).map(([cat, list]) => ({ cat, list }));
  entries.sort((a, b) => a.cat.localeCompare(b.cat));
  return entries;
}

export function getCategories(samples = []) {
  const cats = new Set();
  for (const s of samples) cats.add(toCategory(s));
  return Array.from(cats).sort((a, b) => a.localeCompare(b));
}

export function getDisplayName(category, names = {}) {
  return (names?.[category] || category);
}

export function getGroupOptions(samples = [], names = {}) {
  const groups = groupSamplesByCategory(samples);
  return groups.map((g) => ({ value: g.cat, label: getDisplayName(g.cat, names), count: g.list.length }));
}