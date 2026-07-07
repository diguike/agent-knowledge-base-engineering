// trust gate 策略检查器：区分被动知识与会跑代码的组件，结合工作区信任与 marketplace 白名单，
// 判定每个组件是「直接加载 / 需信任才启用 / 受限不启用 / 直接拒绝」。

export type ComponentType = 'knowledge' | 'hook' | 'mcp' | 'lsp';

export interface Component {
  name: string;
  type: ComponentType;
  marketplace: string;
}

export interface TrustPolicy {
  workspaceTrusted: boolean; // 工作区是否被用户信任
  allowedMarketplaces: string[]; // 组织受管设置里允许的 marketplace 白名单
}

export type Verdict = '直接加载' | '启用' | '受限不启用' | '拒绝';

// 会跑代码的组件类型（受信任闸额外限制）。
const CODE_RUNNING: ComponentType[] = ['hook', 'mcp', 'lsp'];

export function gate(c: Component, policy: TrustPolicy): { verdict: Verdict; reason: string } {
  // ① 来源白名单（组织受管设置）优先——白名单外一律拒绝
  if (!policy.allowedMarketplaces.includes(c.marketplace)) {
    return { verdict: '拒绝', reason: `marketplace「${c.marketplace}」不在受管白名单` };
  }
  // ② 被动知识：直接加载
  if (!CODE_RUNNING.includes(c.type)) {
    return { verdict: '直接加载', reason: '被动知识，不执行代码' };
  }
  // ③ 会跑代码的组件：必须工作区被信任才启用
  return policy.workspaceTrusted
    ? { verdict: '启用', reason: '会跑代码，但工作区已信任' }
    : { verdict: '受限不启用', reason: '会跑代码，工作区未信任' };
}
