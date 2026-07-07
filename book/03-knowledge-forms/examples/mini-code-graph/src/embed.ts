// 本地确定性词袋 embedding（与第 1 章相同），用于对照「向量召回」路径。
// 生产会换成真 embedding 模型；这里离线可复现即可。

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+|[一-龥]/g) ?? [];
}

export function buildVocab(texts: string[]): Map<string, number> {
  const vocab = new Map<string, number>();
  for (const text of texts) {
    for (const tok of tokenize(text)) {
      if (!vocab.has(tok)) vocab.set(tok, vocab.size);
    }
  }
  return vocab;
}

export function vectorize(tokens: string[], vocab: Map<string, number>): number[] {
  const vec = new Array(vocab.size).fill(0);
  for (const tok of tokens) {
    const idx = vocab.get(tok);
    if (idx !== undefined) vec[idx] += 1;
  }
  return vec;
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
