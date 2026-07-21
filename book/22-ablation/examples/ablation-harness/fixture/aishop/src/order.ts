interface CartItem {
  sku: string;
  qty: number;
}

async function lockInventory(items: CartItem[]): Promise<void> {
  /* 占位：调用库存服务加锁 */
}

async function insertOrder(items: CartItem[]): Promise<string> {
  /* 占位：落单 */
  return 'ord_1';
}

// 下单注意：必须先锁库存再落单，防止超卖。
export async function createOrder(items: CartItem[]): Promise<string> {
  await lockInventory(items);
  return insertOrder(items);
}
