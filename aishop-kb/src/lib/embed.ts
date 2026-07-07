// 本地确定性词袋 embedding，零依赖、离线可复现。
// 【生产替换插槽】把 tokenize/vectorize 换成真 embedding 模型（如 bge / text-embedding-3），
// 检索与聚类质量更好，但上层骨架不变。

// 分词：英文数字按串切，中文按单字切。
export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+|[一-龥]/g) ?? [];
}

// 2-gram：中文按 2 字滑窗，英文数字保留整串。用于近重复/冲突检测的相似度。
export function grams(text: string): string[] {
  const out: string[] = [];
  for (const run of text.match(/[一-龥]{2,}|[a-z0-9]+/gi) ?? []) {
    if (/[一-龥]/.test(run)) for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
    else out.push(run.toLowerCase());
  }
  return out;
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

// 基于 2-gram 集合的余弦相似度（词频计权），用于文本对文本的相似度判定。
export function gramCosine(a: string, b: string): number {
  const ga = grams(a);
  const gb = grams(b);
  const all = [...new Set([...ga, ...gb])];
  const va = all.map((t) => ga.filter((x) => x === t).length);
  const vb = all.map((t) => gb.filter((x) => x === t).length);
  return cosine(va, vb);
}
