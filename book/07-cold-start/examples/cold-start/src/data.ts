// 模拟从 Notion / Confluence 导出的一批存量文档。
// 每份带最后修改时间、owner、来源、内容——冷启动分诊就靠这些元信息 + 内容判断。

export interface LegacyDoc {
  id: string;
  title: string;
  source: 'notion' | 'confluence' | 'gdocs';
  owner: string | null;
  lastModified: string; // ISO 日期
  content: string;
}

export const legacyDocs: LegacyDoc[] = [
  { id: 'd1', title: '订单状态机说明', source: 'confluence', owner: '张三', lastModified: '2026-05-10', content: '订单状态机 created paid shipped，改 status 走 advanceOrder' },
  { id: 'd2', title: '退款合规要求', source: 'confluence', owner: '李四', lastModified: '2026-06-01', content: '退款超过 5000 需人工审核，命中风控名单不允许自动退款' },
  { id: 'd3', title: '全公司报销政策', source: 'notion', owner: 'HR', lastModified: '2026-04-20', content: '报销需附发票，月底前提交，属于财务行政流程' },
  { id: 'd4', title: '搜索平台团队 wiki', source: 'confluence', owner: '王五', lastModified: '2026-03-15', content: '搜索服务的索引与排序，由搜索平台团队维护' },
  { id: 'd5', title: '2023 双十一秒杀活动页', source: 'notion', owner: '赵六', lastModified: '2023-11-12', content: '秒杀活动规则，该功能已于 2024 下线' },
  { id: 'd6', title: '库存旧设计草稿', source: 'gdocs', owner: null, lastModified: '2025-12-01', content: '库存扣减的一版早期设计，没人认领' },
  { id: 'd7', title: '对账流程', source: 'confluence', owner: '孙七', lastModified: '2026-02-08', content: '对账任务每日凌晨跑，差异优先查支付回调' },
  { id: 'd8', title: '旧版系统架构图', source: 'gdocs', owner: '钱九', lastModified: '2024-01-20', content: '两年前的整体架构，已多次重构，多处对不上现状' },
  { id: 'd9', title: '新人 onboarding 指南', source: 'notion', owner: 'HR', lastModified: '2026-01-05', content: '入职流程、工位申请，与本系统业务无关' },
  { id: 'd10', title: '大促库存扩容经验', source: 'notion', owner: '周八', lastModified: '2026-06-18', content: '大促期间库存服务提前扩容到平时的 3 倍' },
];
