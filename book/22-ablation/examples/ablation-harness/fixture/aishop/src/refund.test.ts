import { review } from './refund';

// 旧用例：3200 元走人工审核（旧阈值 3000 时期写下，断言早已更新、注释没更新）。
// 这是消融实验里的经典干扰项——代码兜底检索可能命中这行旧注释，答出过期的 3000。
console.assert(review(3200) === 'auto');

// 现行阈值 5000 的边界用例。
console.assert(review(5001) === 'manual');
console.assert(review(4999) === 'auto');
