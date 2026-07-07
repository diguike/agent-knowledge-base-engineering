// 最小、确定性的 K-means（按余弦相似度分簇）。
// 确定性来自「用间隔取样的固定点做初始质心」，不引入随机，保证示例可复现。

import { cosine } from './embed';

function meanVector(vectors: number[][]): number[] {
  const dim = vectors[0].length;
  const out = new Array(dim).fill(0);
  for (const v of vectors) for (let i = 0; i < dim; i++) out[i] += v[i];
  for (let i = 0; i < dim; i++) out[i] /= vectors.length;
  return out;
}

export interface KMeansResult {
  assignments: number[];
  centroids: number[][];
}

export function kmeans(vectors: number[][], k: number, maxIter = 50): KMeansResult {
  const n = vectors.length;
  const step = Math.max(1, Math.floor(n / k));
  let centroids = Array.from({ length: k }, (_, i) => vectors[Math.min(i * step, n - 1)].slice());
  let assignments = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    const next = vectors.map((v) => {
      let best = 0;
      let bestSim = -Infinity;
      centroids.forEach((c, ci) => {
        const s = cosine(v, c);
        if (s > bestSim) {
          bestSim = s;
          best = ci;
        }
      });
      return best;
    });
    if (next.every((a, i) => a === assignments[i])) break;
    assignments = next;
    centroids = centroids.map((old, ci) => {
      const members = vectors.filter((_, i) => assignments[i] === ci);
      return members.length ? meanVector(members) : old;
    });
  }
  return { assignments, centroids };
}
