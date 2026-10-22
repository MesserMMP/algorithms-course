import type { Node } from './algorithms';

export function pathTo(root: Node | null, id: string | null): string[] {
  if (!root || !id) return [];
  if (root.id === id) return [id];
  const child = pathTo(root.left, id);
  const path = child.length ? child : pathTo(root.right, id);
  return path.length ? [root.id, ...path] : [];
}

// The unique route goes up to the common ancestor, then down to the next node.
export function routeBetween(root: Node | null, from: string | null, to: string | null): string[] {
  const end = pathTo(root, to);
  if (!end.length) return [];
  const start = pathTo(root, from);
  if (!start.length) return end;
  let common = 0;
  while (common < start.length && common < end.length && start[common] === end[common]) common++;
  return [...start.slice(common - 1).reverse(), ...end.slice(common)];
}
