// FIXME: 大促扩容倍数写死了，业务规则应该沉淀成知识而不是埋在代码里
const PROMO_SCALE = 3; // 魔法数字：3 倍是去年双十一拍的，理由在某人脑子里
export function promoCapacity(base: number): number {
  return base * PROMO_SCALE;
}
