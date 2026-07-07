// 分层加载器：按仓库 L2 里的依赖声明，只加载 L0 + 被声明的 L1 包 + 本地增量。
// 「裁剪 = 选择性依赖」——召回范围从加载那一刻就被依赖声明圈定，无关包压根不进来。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

export interface LoadedDoc {
  layer: 'L0' | 'L1' | 'L2';
  pkg: string;
  content: string;
}

// 从仓库 AGENTS.md 解析依赖声明。
export function parseDeps(repo: string): string[] {
  const text = readFileSync(join(ROOT, 'repos', repo, 'AGENTS.md'), 'utf8');
  const m = text.match(/^依赖:\s*(.+)$/m);
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
}

// 加载一个仓库的知识范围：L0（人人继承）+ 声明的 L1 包 + L2 本地。
export function loadScope(repo: string): LoadedDoc[] {
  const docs: LoadedDoc[] = [];
  docs.push({ layer: 'L0', pkg: 'L0/base', content: readFileSync(join(ROOT, 'kb/L0/base.md'), 'utf8') });
  for (const dep of parseDeps(repo)) {
    try {
      docs.push({ layer: 'L1', pkg: dep, content: readFileSync(join(ROOT, 'kb/L1', dep, 'knowledge.md'), 'utf8') });
    } catch {
      // 依赖声明和知识包目录不同步，是分层模式下最常见的真实故障（拼错包名、包还没发布）。
      console.warn(`  ⚠ 依赖 ${dep} 未在 kb/L1 找到，请检查 AGENTS.md 声明或该知识包是否已发布`);
    }
  }
  docs.push({ layer: 'L2', pkg: `${repo}/AGENTS`, content: readFileSync(join(ROOT, 'repos', repo, 'AGENTS.md'), 'utf8') });
  return docs;
}

// 在「已加载范围」内检索——范围外的知识根本没进来，不是被过滤掉的。
export function query(repo: string, question: string): { hitPkg: string; line: string } | null {
  // 注：这里用简单的 n-gram 字符重叠模拟检索，只为聚焦「加载范围决定召回边界」这个机制；
  // 生产环境请替换成真正的关键词 / 向量检索。
  const scope = loadScope(repo);
  const grams = question.match(/[一-龥]{2,3}/g) ?? [];
  for (const doc of scope) {
    for (const line of doc.content.split('\n')) {
      if (grams.some((g) => line.includes(g)) && line.trim().startsWith('-')) {
        return { hitPkg: doc.pkg, line: line.trim() };
      }
    }
  }
  return null;
}
