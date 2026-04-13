export function hasMeaningfulText(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  const lowered = text.toLowerCase();
  return !['n/a', 'na', 'null', 'undefined', 'your name', 'degree name', 'university / college'].includes(lowered);
}

export function hasMeaningfulArray(items) {
  return Array.isArray(items) && items.some((item) => {
    if (typeof item === 'string') return hasMeaningfulText(item);
    if (!item || typeof item !== 'object') return false;
    return Object.values(item).some((value) => {
      if (Array.isArray(value)) return value.some((entry) => hasMeaningfulText(entry));
      return hasMeaningfulText(value);
    });
  });
}

export function toBullets(value, maxItems = 5) {
  const raw = Array.isArray(value) ? value : String(value || '').split('\n');
  const items = raw
    .flatMap((item) => String(item || '').split(/\n|(?<=[.;])\s+(?=[A-Z])/))
    .map((item) => String(item || '').trim())
    .filter(hasMeaningfulText);

  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
    if (output.length >= maxItems) break;
  }
  return output;
}
