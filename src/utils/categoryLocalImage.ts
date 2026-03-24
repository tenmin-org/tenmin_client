const webpMods = import.meta.glob('../assets/categories/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const pngMods = import.meta.glob('../assets/categories/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function basename(path: string): string {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return i >= 0 ? path.slice(i + 1) : path;
}

/** Ключ — stem файла в нижнем регистре (например ovoshi). WebP перекрывает PNG. */
const byCode = new Map<string, string>();

for (const [path, url] of Object.entries(pngMods)) {
  const base = basename(path);
  const m = base.match(/^(.+)\.png$/i);
  if (m) byCode.set(m[1].toLowerCase(), url);
}
for (const [path, url] of Object.entries(webpMods)) {
  const base = basename(path);
  const m = base.match(/^(.+)\.webp$/i);
  if (m) byCode.set(m[1].toLowerCase(), url);
}

/**
 * Локальная иконка в `src/assets/categories/{code}.webp` (или `.png`).
 * Совпадает с полем `category.code` из API.
 */
export function getLocalCategoryImageUrl(
  code: string | null | undefined,
): string | null {
  if (code == null || code === '') return null;
  return byCode.get(code.trim().toLowerCase()) ?? null;
}
