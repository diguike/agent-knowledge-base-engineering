// plugin 依赖解析 + prune：按 enabledPlugins 顺着依赖图算出完整安装集，
// 并算出「已装但不再被任何启用项依赖」的孤儿。这是 npm 式依赖图的最小实现。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

interface Plugin {
  name: string;
  version: string;
  dependencies: string[];
}

export function loadMarketplace(): Map<string, Plugin> {
  const mp = JSON.parse(readFileSync(join(ROOT, 'marketplace.json'), 'utf8')) as { plugins: Plugin[] };
  return new Map(mp.plugins.map((p) => [p.name, p]));
}

export function loadEnabled(): string[] {
  const s = JSON.parse(readFileSync(join(ROOT, '.claude', 'settings.json'), 'utf8')) as {
    enabledPlugins: Record<string, boolean>;
  };
  // enabledPlugins 是对象 map：{ "aishop-refund@aishop-kb": true }。
  // 取值为 true 的键，再去掉 @marketplace 后缀拿到 plugin 名。
  return Object.entries(s.enabledPlugins)
    .filter(([, on]) => on)
    .map(([k]) => k.split('@')[0]);
}

// 从一组顶层启用项，顺着 dependencies 算出完整安装集（含传递依赖）。
export function resolveInstallSet(enabled: string[], market: Map<string, Plugin>): Set<string> {
  const result = new Set<string>();
  const visit = (name: string): void => {
    if (result.has(name)) return;
    const p = market.get(name);
    if (!p) throw new Error(`plugin ${name} 不在 marketplace 中`);
    result.add(name);
    p.dependencies.forEach(visit);
  };
  enabled.forEach(visit);
  return result;
}

// prune：已装集合里，凡是不在「启用项可达集」中的，都是孤儿。
export function prune(installed: string[], enabled: string[], market: Map<string, Plugin>): string[] {
  const reachable = resolveInstallSet(enabled, market);
  return installed.filter((p) => !reachable.has(p));
}
