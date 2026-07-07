// 本地确定性词袋 embedding（沿用前几章）。
// 生产替换为真 embedding 模型，聚类质量更好，但整套骨架不变。

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+|[一-龥]/g) ?? [];
}

export function buildVocab(texts: string[]): Map<string, number> {
  const vocab = new Map<string, number>();
  for (const t of texts) for (const tok of tokenize(t)) if (!vocab.has(tok)) vocab.set(tok, vocab.size);
  return vocab;
}

export function vectorize(text: string, vocab: Map<string, number>): number[] {
  const v = new Array(vocab.size).fill(0);
  for (const tok of tokenize(text)) {
    const i = vocab.get(tok);
    if (i !== undefined) v[i] += 1;
  }
  return v;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}
