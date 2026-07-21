// 实验臂 = 挂载矩阵：每个臂声明「去掉哪些知识」，而不是「有/无知识库」二值开关。
// 生产中这份定义可以放 ablation.yaml，随知识库一起版本化。
export interface Arm {
  name: string;
  label: string;
  unmount: string[]; // 相对臂目录的路径，物化时删除
}

export const arms: Arm[] = [
  { name: 'full', label: '全量 aishop-kb', unmount: [] },
  { name: 'no-refund-doc', label: '去掉退款包（docs/refund.md）', unmount: ['docs/refund.md'] },
  { name: 'no-handwritten', label: '去掉手写层（docs/ + llms.txt）', unmount: ['docs', 'llms.txt'] },
  { name: 'bare', label: '裸 agent（只剩源码）', unmount: ['docs', 'llms.txt', 'AGENTS.md'] },
];

export const TRIALS = 5; // 每臂每题采样次数（算 pass^k 用）
