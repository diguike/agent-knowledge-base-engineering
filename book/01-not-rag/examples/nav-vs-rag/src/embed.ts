// 一个本地的、确定性的词袋（bag-of-words）embedding。
// 生产中你会把它换成真正的 embedding 模型（见第 10 章），
// 这里为了让示例零依赖、可离线复现，用词频向量 + 余弦相似度模拟「向量召回」。

// 把一段文本切成小写 token（按非字母数字与 CJK 边界分割）。
export function tokenize(text: string): string[] {
  const matched = text.toLowerCase().match(/[a-z0-9]+|[一-龥]/g);
  return matched ?? [];
}

// 用一份词表把 token 列表变成词频向量。
export function vectorize(tokens: string[], vocab: Map<string, number>): number[] {
  const vec = new Array(vocab.size).fill(0);
  for (const tok of tokens) {
    const idx = vocab.get(tok);
    if (idx !== undefined) vec[idx] += 1;
  }
  return vec;
}

// 余弦相似度。
export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// 从若干文本构建全局词表。
export function buildVocab(texts: string[]): Map<string, number> {
  const vocab = new Map<string, number>();
  for (const text of texts) {
    for (const tok of tokenize(text)) {
      if (!vocab.has(tok)) vocab.set(tok, vocab.size);
    }
  }
  return vocab;
}
