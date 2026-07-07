// 干扰项：注释里提到 canTransition，但这里并没有真的调用它。
// 早期版本曾在这里用 canTransition 做校验，现已迁走，仅留说明。
export function legacyNoop(): void {
  return;
}
