// 最小代码图谱：把代码当成「符号 + 引用」的图，而不是文本。
// 用轻量正则抽出函数定义与调用关系，回答「谁调用了某个函数」。
// 注：真实项目会用编译器/LSP 生成 AST 级索引（如 SCIP），
// 这里用正则做最小演示，核心是展示「图沿调用边确定定位」这一点。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

// 去掉 // 行注释，避免把注释里提到的符号误判成调用。
function stripComments(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

export interface CallSite {
  callerFile: string;
  callerFn: string;
}

// 图节点：一个函数定义。
export interface FnDef {
  name: string;
  file: string;
}

// 抽出所有函数定义（图的节点）。
export function collectDefs(repoRoot: string): FnDef[] {
  const defs: FnDef[] = [];
  for (const file of listFiles(repoRoot).sort()) {
    const code = stripComments(readFileSync(file, 'utf8'));
    for (const m of code.matchAll(/(?:export\s+)?function\s+(\w+)\s*\(/g)) {
      defs.push({ name: m[1], file: relative(repoRoot, file) });
    }
  }
  return defs;
}

// 沿「被调用」边遍历：找出所有调用了 target 的位置（图的边）。
export function findCallers(repoRoot: string, target: string): CallSite[] {
  const callers: CallSite[] = [];
  const callRe = new RegExp(`\\b${target}\\s*\\(`);
  for (const file of listFiles(repoRoot).sort()) {
    const code = stripComments(readFileSync(file, 'utf8'));
    const lines = code.split('\n');
    let currentFn = '(顶层)';
    lines.forEach((line) => {
      const defMatch = line.match(/(?:export\s+)?function\s+(\w+)\s*\(/);
      if (defMatch) currentFn = defMatch[1];
      // 命中调用，且这一行不是 target 自己的定义行
      if (callRe.test(line) && !new RegExp(`function\\s+${target}\\s*\\(`).test(line)) {
        callers.push({ callerFile: relative(repoRoot, file), callerFn: currentFn });
      }
    });
  }
  return callers;
}
