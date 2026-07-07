// 从单一知识源 .kb/rules.yaml 生成四种 agent 配置格式。
// 改规则只改源，一键重生成，四份同步——从根上消除多份手写的漂移。

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// 生成区标记：重新生成时只替换标记之间的内容，标记之外的手写部分原样保留。
const BEGIN = '<!-- KB:GENERATED:BEGIN -->';
const END = '<!-- KB:GENERATED:END -->';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'out');

export interface Rule {
  id: string;
  scope: string;
  text: string;
}

// 解析单一源（手写解析，不引 YAML 库以保持零依赖）。
export function parseSource(): Rule[] {
  const lines = readFileSync(join(ROOT, '.kb', 'rules.yaml'), 'utf8').split('\n');
  const rules: Rule[] = [];
  let cur: Partial<Rule> = {};
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '');
    const idm = line.match(/^\s*-\s*id:\s*(.+)$/);
    const sm = line.match(/^\s*scope:\s*(.+)$/);
    const tm = line.match(/^\s*text:\s*(.+)$/);
    if (idm) {
      if (cur.id) rules.push(cur as Rule);
      cur = { id: idm[1].trim() };
    } else if (sm) cur.scope = sm[1].trim();
    else if (tm) cur.text = tm[1].trim();
  }
  if (cur.id) rules.push(cur as Rule);
  return rules;
}

// 只替换生成区：文件已存在且带标记则替换标记之间，否则用 shell 模板首次落盘。
// shell 里的 {{BLOCK}} 是生成区占位，其余内容（手写介绍等）不会被后续重生成冲掉。
function upsert(rel: string, shell: string, body: string): void {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  const block = `${BEGIN}\n${body}\n${END}`;
  let content: string;
  if (existsSync(p)) {
    const existing = readFileSync(p, 'utf8');
    content =
      existing.includes(BEGIN) && existing.includes(END)
        ? existing.replace(new RegExp(`${BEGIN}[\\s\\S]*?${END}`), block)
        : existing.trimEnd() + '\n\n' + block + '\n';
  } else {
    content = shell.replace('{{BLOCK}}', block);
  }
  writeFileSync(p, content, 'utf8');
}

// 四种格式的渲染器。每种都把规则以 `- <text>` 落成条目，方便反向核对一致性。
export function generateAll(): { rules: Rule[]; files: string[] } {
  const rules = parseSource();
  const bullets = rules.map((r) => `- ${r.text}`).join('\n');

  // 1) CLAUDE.md（Claude Code）——shell 里带一段手写介绍，演示它不会被冲掉
  upsert('CLAUDE.md', `# 项目约定\n\n（这段是手写介绍，生成器不会动它。）\n\n{{BLOCK}}\n`, bullets);
  // 2) AGENTS.md（半可移植事实标准，Codex 等认）
  upsert('AGENTS.md', `# AGENTS\n\n## 约定\n\n{{BLOCK}}\n`, bullets);
  // 3) .cursor/rules/aishop.mdc（Cursor 的 MDC：frontmatter + 正文）
  upsert(
    '.cursor/rules/aishop.mdc',
    `---\ndescription: aishop 项目约定\nalwaysApply: true\n---\n\n{{BLOCK}}\n`,
    bullets,
  );
  // 4) .github/copilot-instructions.md（GitHub Copilot）
  upsert('.github/copilot-instructions.md', `# Copilot 指令\n\n{{BLOCK}}\n`, bullets);

  return {
    rules,
    files: ['CLAUDE.md', 'AGENTS.md', '.cursor/rules/aishop.mdc', '.github/copilot-instructions.md'],
  };
}
