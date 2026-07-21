// 确定性 mock agent：在指定臂目录内按「AGENTS.md 约定 → llms.txt 索引导航 → grep 代码兜底」
// 的次序取知识作答（即第 6 章的检索优先级协议）。全程只读臂目录，统计读取字节数。
// 生产替换点：把本文件换成真 agent 的调用适配器（如 `claude -p "<question>"`，cwd 锁在臂目录）。
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface AgentAnswer {
  answer: string;
  source: 'agents-md' | 'docs' | 'code' | 'none';
  bytesRead: number;
}

// 中文二字词片 + 数字（与第 6、21 章示例同一套切词）。
function grams(s: string): string[] {
  const out: string[] = [];
  for (const run of s.match(/[一-龥]{2,}|\d+/g) ?? []) {
    if (/^\d+$/.test(run)) out.push(run);
    else for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
  }
  return [...new Set(out)];
}

function overlap(q: string[], text: string): number {
  const t = new Set(grams(text));
  return q.filter((g) => t.has(g)).length;
}

// 消融实验必须可复现：用带种子的确定性伪随机数（mulberry32），种子来自 臂+题+第几次。
export function seededRng(seedStr: string): () => number {
  let h = 2166136261;
  for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readIfExists(file: string, counter: { bytes: number }): string | null {
  if (!fs.existsSync(file)) return null;
  const s = fs.readFileSync(file, 'utf-8');
  counter.bytes += Buffer.byteLength(s);
  return s;
}

export function answerQuestion(armDir: string, question: string, seedStr: string): AgentAnswer {
  const q = grams(question);
  const counter = { bytes: 0 };

  // 1) AGENTS.md 本地约定：约定行与问题词片重合 >= 2 才认为命中。
  const agentsMd = readIfExists(path.join(armDir, 'AGENTS.md'), counter);
  if (agentsMd) {
    for (const line of agentsMd.split('\n')) {
      if (line.startsWith('- ') && overlap(q, line) >= 2) {
        return { answer: line.slice(2), source: 'agents-md', bytesRead: counter.bytes };
      }
    }
  }

  // 2) llms.txt 索引导航：定位最相关文档，完整读回，取重合度最高的规则行。
  const llms = readIfExists(path.join(armDir, 'llms.txt'), counter);
  if (llms) {
    let bestDoc: string | null = null;
    let bestScore = 0;
    for (const line of llms.split('\n')) {
      const m = line.match(/^- \[[^\]]+\]\(([^)]+)\): (.*)$/);
      if (!m) continue;
      const score = overlap(q, line);
      if (score > bestScore) {
        bestScore = score;
        bestDoc = m[1];
      }
    }
    if (bestDoc && bestScore >= 1) {
      const doc = readIfExists(path.join(armDir, bestDoc), counter);
      if (doc) {
        let bestLine: string | null = null;
        let bestLineScore = 0;
        for (const line of doc.split('\n')) {
          if (!line.startsWith('- ')) continue;
          const score = overlap(q, line);
          if (score > bestLineScore) {
            bestLineScore = score;
            bestLine = line.slice(2);
          }
        }
        if (bestLine) return { answer: bestLine, source: 'docs', bytesRead: counter.bytes };
      }
    }
  }

  // 3) grep 代码兜底：全量扫 src/，词片重合 >= 2 的行都是候选。
  //    候选不止一个时 agent 只能挑一个——挑中哪条随试次波动，这正是兜底不稳的来源。
  const candidates: string[] = [];
  const srcDir = path.join(armDir, 'src');
  if (fs.existsSync(srcDir)) {
    for (const f of fs.readdirSync(srcDir)) {
      const content = readIfExists(path.join(srcDir, f), counter);
      if (!content) continue;
      for (const line of content.split('\n')) {
        if (overlap(q, line) >= 2) candidates.push(line.trim());
      }
    }
  }
  if (candidates.length > 0) {
    const rng = seededRng(seedStr);
    const pick = candidates[Math.floor(rng() * candidates.length)];
    return { answer: `${pick}（来自代码反推，未经文档确认）`, source: 'code', bytesRead: counter.bytes };
  }

  return { answer: '不确定：仓库内没有找到相关知识', source: 'none', bytesRead: counter.bytes };
}
