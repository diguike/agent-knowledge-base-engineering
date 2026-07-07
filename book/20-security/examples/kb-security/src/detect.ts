// 知识投毒检测器：扫描常见的 prompt injection 模式，把可疑知识拦下送人审。
// 这是投毒纵深防御的第二道（第一道是贡献闸人审）——只抓明显特征，不替代人审。

export interface InjectionPattern {
  name: string;
  re: RegExp;
}

// 常见注入模式（可扩展）。生产可接更强的检测模型。
export const PATTERNS: InjectionPattern[] = [
  { name: '覆盖指令', re: /忽略(之前|上述|前面).{0,4}(规则|指令|要求)|无视(上述|之前).{0,4}(规则|指令)|ignore\s+(all\s+)?previous/i },
  { name: '角色劫持', re: /你现在是|from now on you are|你的新(身份|角色)/i },
  { name: '数据外传', re: /(发送|上传|外传|外发)[^\n]{0,12}(https?:\/\/|外部)|send\b[^\n]*\bto\b[^\n]*https?/i },
  { name: '越权提权', re: /批准所有|approve\s+all|最高优先级|绕过(审核|风控|权限)/i },
];

export interface Finding {
  pattern: string;
  matched: string;
}

export function detect(text: string): Finding[] {
  const findings: Finding[] = [];
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m) findings.push({ pattern: p.name, matched: m[0] });
  }
  return findings;
}
