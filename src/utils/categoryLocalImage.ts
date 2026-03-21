const modules = import.meta.glob('../assets/categories/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

function basename(path: string): string {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return i >= 0 ? path.slice(i + 1) : path;
}

const byRootPosition = new Map<number, string>();
const byParentAndChild = new Map<string, string>();

for (const [path, url] of Object.entries(modules)) {
  const base = basename(path);
  const composite = base.match(/^(\d+)_(\d+)\.png$/i);
  if (composite) {
    byParentAndChild.set(`${composite[1]}_${composite[2]}`, url);
    continue;
  }
  const root = base.match(/^(\d+)\.png$/i);
  if (root) {
    byRootPosition.set(Number(root[1]), url);
  }
}

/**
 * Локальные иконки в `src/assets/categories/`:
 * - корень: `{position}.png`
 * - подкатегория: `{parentPosition}_{position}.png` (позиции витрины магазина, как в API)
 */
export function getLocalCategoryImageSrc(
  position: number,
  parentStorePosition?: number | null,
): string | null {
  if (parentStorePosition === undefined) {
    return byRootPosition.get(position) ?? null;
  }
  if (parentStorePosition === null) {
    return null;
  }
  return (
    byParentAndChild.get(`${parentStorePosition}_${position}`) ?? null
  );
}
