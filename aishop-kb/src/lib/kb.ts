// 知识库加载器：所有命令共享这一个入口，把 kb/ 目录读成统一的内存表示。
// 这是「收拢成一个产品」的核心——coverage/serve/check/extract/eval/drift 都从这里取数，
// 而不是各自造一份 kb。

import { existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 仓库根目录（src/lib/kb.ts 往上两级）。
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KB_ROOT = join(REPO_ROOT, 'kb');
export const L1_ROOT = join(KB_ROOT, 'L1');

// 参考日期：固定为发书日，保证 drift / TTL 计算可复现。生产直接用 new Date()。
export const REF_DATE = new Date('2026-07-07');

export interface Chunk {
  namespace: string; // 所属知识包名（去掉 kb- 前缀），即召回 namespace
  text: string; // 规则正文（已去掉 roles 前缀）
  roles: string[]; // 可访问该片段的角色；['*'] 表示公开
}

export interface KbPackage {
  dir: string; // kb-orders
  namespace: string; // orders
  mdPath: string; // knowledge.md 绝对路径
  fm: Record<string, string>; // 五字段 frontmatter
  chunks: Chunk[];
}

import { parseFrontmatter } from './frontmatter';

// 解析一行知识：支持 `- (roles: a,b) 正文` 或 `- 正文`（默认公开）。
function parseLine(line: string, namespace: string): Chunk | null {
  const withRoles = line.match(/^-\s*\(roles:\s*(.+?)\)\s*(.+)$/);
  if (withRoles) {
    return { namespace, text: withRoles[2].trim(), roles: withRoles[1].split(',').map((s) => s.trim()) };
  }
  const plain = line.match(/^-\s+(.+)$/);
  if (plain) return { namespace, text: plain[1].trim(), roles: ['*'] };
  return null;
}

// 加载所有 L1 知识包。
export function loadPackages(): KbPackage[] {
  const pkgs: KbPackage[] = [];
  for (const dir of readdirSync(L1_ROOT).sort()) {
    const mdPath = join(L1_ROOT, dir, 'knowledge.md');
    if (!existsSync(mdPath)) continue;
    const namespace = dir.replace(/^kb-/, '');
    const { fm, body } = parseFrontmatter(mdPath);
    const chunks: Chunk[] = [];
    for (const line of body.split('\n')) {
      const c = parseLine(line, namespace);
      if (c) chunks.push(c);
    }
    pkgs.push({ dir, namespace, mdPath, fm, chunks });
  }
  return pkgs;
}

// 拍平成 chunk 列表（跨包）。
export function allChunks(): Chunk[] {
  return loadPackages().flatMap((p) => p.chunks);
}

// 列出 kb 下所有 .md 文件（L0 + L1 + promote 出来的条目），供质量门禁遍历。
export function listMarkdown(dir: string = KB_ROOT): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...listMarkdown(p));
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}
