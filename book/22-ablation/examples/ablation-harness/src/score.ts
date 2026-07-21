// 打分：断言判定（沿用第 21 章必答点/禁答点）+ pass^k 组合公式。
import type { Golden } from './goldens';

export function assertAnswer(answer: string, g: Golden): boolean {
  for (const m of g.mustInclude) if (!answer.includes(m)) return false;
  for (const n of g.mustNotInclude) if (answer.includes(n)) return false;
  return true;
}

// pass^k = C(success, k) / C(trials, k)：随机抽 k 次全过的概率（与第 21 章同一公式）。
export function passHatK(success: number, trials: number, k: number): number {
  if (k > trials) return 0;
  if (k > success) return 0;
  let num = 1;
  let den = 1;
  for (let i = 0; i < k; i++) {
    num *= success - i;
    den *= trials - i;
  }
  return num / den;
}
