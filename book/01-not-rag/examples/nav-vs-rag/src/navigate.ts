// 确定性导航路径：模拟 agent 的 grep / glob / read。
// 对「订单状态机怎么流转」这类边界可枚举的问题，
// 直接按符号定位到定义文件，并完整读回——结果确定、可复现、结构完整。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// glob：递归列出目录下所有文件。
function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

export interface NavResult {
  file: string;
  content: string;
  matchedBy: string;
}

// grep：按「定义级」符号定位状态机的权威来源。
// 关键点：我们找的是「定义」（enum + 流转表），而不是任何提到 status 的地方。
export function navigate(repoRoot: string): NavResult | null {
  const definingSymbols = [/\benum\s+OrderStatus\b/, /\bORDER_TRANSITIONS\b/];
  for (const file of listFiles(repoRoot).sort()) {
    const content = readFileSync(file, 'utf8');
    const hit = definingSymbols.find((re) => re.test(content));
    if (hit) {
      // 命中即完整读回整个文件，不做任何切块。
      return { file, content, matchedBy: hit.source };
    }
  }
  return null;
}
