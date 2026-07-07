// 两个来源的原始输入：SME 访谈 + 真实 query 日志。
// 刻意让 query 日志里出现 SME 没提到的场景（风控、对账），演示「两来源缺一不可」。

// 来源一：SME 访谈梳理出的业务场景（人只会列他记得的）。
export const smeScenarios = ['下单', '支付', '退款', '库存'];

// 来源二：真实 query 日志，原始问句、未打标（真实世界拿到的就是这样一堆问句）。
// 「归到哪个业务场景」是聚类这一步要做的事，见 build.ts 的 classify()。
export const rawQueries: { q: string; freq: number }[] = [
  { q: '怎么写下单接口的库存校验', freq: 42 },
  { q: '支付回调没收到怎么排查', freq: 30 },
  { q: '一笔 6000 的订单能自动退款吗', freq: 18 },
  { q: '大促库存要扩容几倍', freq: 12 },
  // 下面两条问的是 SME 访谈根本没提到的场景（风控、对账），聚类后会冒出来——正是盲区来源
  { q: '订单命中风控名单还能退款吗', freq: 25 },
  { q: '对账差异怎么定位', freq: 9 },
];

// 任务场景（矩阵的列）。
export const taskScenarios = ['写代码', '排障', '答疑合规'];

// 预置的 golden 问答对骨架（真实项目里由人对着矩阵格子逐步补全）。
export interface Golden {
  scenario: string;
  task: string;
  question: string;
  mustInclude: string[]; // 必答点
  mustNotInclude: string[]; // 禁答点
}

export const goldens: Golden[] = [
  {
    scenario: '下单',
    task: '写代码',
    question: '下单时怎么保证不超卖？',
    mustInclude: ['先锁库存', '再创建订单'],
    mustNotInclude: ['直接扣减不加锁'],
  },
  {
    scenario: '退款',
    task: '答疑合规',
    question: '一笔 6000 元的订单能自动退款吗？',
    mustInclude: ['超过 5000 需人工审核', '命中风控名单不允许自动退款'],
    mustNotInclude: ['可以直接自动退款'],
  },
  {
    scenario: '库存',
    task: '排障',
    question: '大促期间库存不足报警怎么处理？',
    mustInclude: ['提前扩容到平时 3 倍'],
    mustNotInclude: [],
  },
];
