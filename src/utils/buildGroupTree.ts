import { StandaloneContext } from '../types/StandaloneContext';

export interface GroupTreeItem {
  name: string;
  depth: number;
  hasChildren: boolean;
}

export function buildGroupTree(
  contexts: StandaloneContext[],
  extraNames: string[] = [],
  excludeName?: string
): GroupTreeItem[] {
  // Merge all known names
  const allNames = new Set<string>([...contexts.map(c => c.name), ...extraNames]);

  // Build children map from context records
  const childrenOf: Record<string, string[]> = {};
  const childSet = new Set<string>();

  contexts.forEach(ctx => {
    if (ctx.parentContext) {
      if (!childrenOf[ctx.parentContext]) childrenOf[ctx.parentContext] = [];
      childrenOf[ctx.parentContext].push(ctx.name);
      childSet.add(ctx.name);
    }
  });

  // Sort each child list alphabetically
  Object.values(childrenOf).forEach(arr => arr.sort((a, b) => a.localeCompare(b)));

  // Root = known name that is not a child
  const roots = [...allNames]
    .filter(n => !childSet.has(n))
    .sort((a, b) => a.localeCompare(b));

  const result: GroupTreeItem[] = [];

  function traverse(name: string, depth: number) {
    if (name === excludeName) return;
    const children = (childrenOf[name] || []).filter(c => c !== excludeName);
    result.push({ name, depth, hasChildren: children.length > 0 });
    children.forEach(child => traverse(child, depth + 1));
  }

  roots.forEach(name => traverse(name, 0));
  return result;
}

/** Returns the display label for a group option in a <select>, with indentation. */
export function groupOptionLabel(name: string, depth: number): string {
  return '\u00A0\u00A0\u00A0\u00A0'.repeat(depth) + (depth > 0 ? '↳ ' : '') + name;
}
