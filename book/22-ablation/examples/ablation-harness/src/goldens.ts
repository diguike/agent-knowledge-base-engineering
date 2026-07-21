// golden 问答集：沿用第 4 章场景矩阵 + 第 21 章必答点/禁答点的格式。
// knowledge 字段标注每道题考察的知识载体，供翻转归因时对号入座。
export interface Golden {
  id: string;
  question: string;
  mustInclude: string[];
  mustNotInclude: string[];
  knowledge: string; // 该题答案所在的知识载体
}

export const goldens: Golden[] = [
  {
    id: 'G1',
    question: '退款多少金额要人工审核',
    mustInclude: ['5000'],
    mustNotInclude: ['3000'],
    knowledge: 'docs/refund.md（代码里也有常量可兜底）',
  },
  {
    id: 'G2',
    question: '命中风控名单的订单能自动退款吗',
    mustInclude: ['不允许'],
    mustNotInclude: [],
    knowledge: 'docs/refund.md（规则只在文档，代码里没有）',
  },
  {
    id: 'G3',
    question: '下单要注意什么',
    mustInclude: ['锁库存'],
    mustNotInclude: [],
    knowledge: 'docs/inventory.md（代码注释也写了，可兜底）',
  },
  {
    id: 'G4',
    question: '金额单位是什么',
    mustInclude: ['分'],
    mustNotInclude: [],
    knowledge: 'AGENTS.md（本地约定，代码里没有）',
  },
  {
    id: 'G5',
    question: '大促库存扩容要做什么',
    mustInclude: ['双写校验'],
    mustNotInclude: [],
    knowledge: 'docs/inventory.md（规则只在文档，代码里没有）',
  },
];
