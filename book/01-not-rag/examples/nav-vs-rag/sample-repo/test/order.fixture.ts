// 测试夹具：构造一个订单对象。含 status 字段，但这不是状态机的定义。
export const orderFixture = {
  id: 'test-order-1',
  status: 'paid',
  items: [{ sku: 'A-1', qty: 2 }],
};
