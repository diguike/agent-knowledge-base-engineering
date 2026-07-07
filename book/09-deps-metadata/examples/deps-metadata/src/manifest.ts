// 最小 manifest 解析器：读 knowledge.yaml，解出继承的 L0、带版本的 L1 依赖、
// 订阅的动态知识 namespace、本地增量目录。
// 注：为零依赖，这里手写针对本 manifest 结构的解析，不引 YAML 库；生产用 js-yaml 之类。

import { readFileSync } from 'node:fs';

export interface Manifest {
  extends: string;
  dependencies: { name: string; range: string }[];
  knowledgeDomains: string[];
  local: string;
}

export function parseManifest(path: string): Manifest {
  const lines = readFileSync(path, 'utf8').split('\n');
  const m: Manifest = { extends: '', dependencies: [], knowledgeDomains: [], local: '' };
  let section: 'deps' | 'domains' | null = null;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, ''); // 去注释
    if (/^extends:/.test(line)) m.extends = line.split(':').slice(1).join(':').trim().replace(/"/g, '');
    else if (/^local:/.test(line)) m.local = line.split(':').slice(1).join(':').trim().replace(/"/g, '');
    else if (/^dependencies:/.test(line)) section = 'deps';
    else if (/^knowledge_domains:/.test(line)) section = 'domains';
    else if (/^\S/.test(line)) section = null; // 顶格行结束当前块
    else if (section === 'deps') {
      const dm = line.match(/"(.+?)":\s*"(.+?)"/);
      if (dm) m.dependencies.push({ name: dm[1], range: dm[2] });
    } else if (section === 'domains') {
      const gm = line.match(/^\s*-\s*(.+)$/);
      if (gm) m.knowledgeDomains.push(gm[1].trim());
    }
  }
  return m;
}
