# ablation-harness：消融实验——git worktree 切臂 + uplift 归因

第 22 章配套示例。回答评测（第 21 章）回答不了的问题：**agent 的通过率里，有多少是知识库挣来的、哪一层哪个包在承重。**

做法：从同一基线 commit 用 `git worktree` 切出 4 个互相隔离的实验臂，按挂载矩阵裁剪知识（全量 / 去单包 / 去手写层 / 裸 agent），同一套 golden 逐臂多次采样打分，输出 uplift 矩阵、逐题翻转归因、pass^k 稳定性与检索成本。

## 从这里开始

本示例自带 `fixture/aishop/`（含 `src/` 代码、`docs/` 手写知识、`llms.txt`、`AGENTS.md`），不依赖前面章节的产物，可独立运行。

## 运行

需要 Node >= 20.11 和 git。

```bash
npx tsx src/main.ts
# 或
npm install && npm start
# 加 --keep 保留切出来的臂目录，可进去查看每个臂到底挂载了什么
npx tsx src/main.ts --keep
```

只用 Node 内置模块 + git 命令，无运行时依赖，全程离线、结果确定可复现。

## 目录

- `fixture/aishop/` —— 被消融的仓库快照：代码衍生知识（`src/refund.ts` 阈值常量）、手写业务知识（`docs/*.md`）、一条埋在旧测试注释里的过期 3000（兜底检索的干扰项）
- `src/arms.ts` —— 实验臂定义（挂载矩阵）
- `src/materialize.ts` —— 臂物化：git worktree 切臂 + 按矩阵裁剪 + llms.txt 索引一致性
- `src/agent.ts` —— 确定性 mock agent（AGENTS.md → llms.txt 导航 → grep 代码兜底，即第 6 章检索优先级协议；生产替换成真 agent 适配器）
- `src/goldens.ts` / `src/score.ts` —— golden 集与断言 + pass^k（沿用第 21 章格式与公式）
- `src/main.ts` —— 编排与五段报告

## 预期输出（关键数字）

**一、通过率矩阵与 uplift**：

```
臂               G1  G2  G3  G4  G5  均值  uplift(相对全量)
full            5/5  5/5  5/5  5/5  5/5  1.00  —
no-refund-doc   3/5  0/5  5/5  5/5  5/5  0.72  0.28
no-handwritten  1/5  0/5  5/5  5/5  0/5  0.44  0.56
bare            3/5  0/5  5/5  0/5  0/5  0.32  0.68
```

知识库整体边际贡献 0.68；其中手写层贡献 0.56——**裸 agent 剩下的 0.32，全是代码衍生知识兜的底。**

**二、翻转归因**：G2（风控拦退款）、G5（扩容双写校验）在去掉文档后直接归零——规则只在文档里，代码兜不了底；G3（先锁库存）任何臂都不翻——代码注释里有，这类代码衍生知识消融不动它；G4（金额单位）只在裸臂翻——它的承重方是 `AGENTS.md`。

**三、pass^k**：G1（退款阈值）代码里有常量可兜底，但兜底要在现行常量和旧测试注释里的 3000 之间碰运气——`pass^1=0.60` 看着还能用，`pass^3=0.10` 暴露它根本不稳。

**四、检索成本**：去掉手写层后，agent 平均每次作答读取的字节数上升 5 成以上（1014 B → 1753 B）——没有索引就只能全量扫代码。

**五、治理提示**：`docs/risk.md` 没有任何 golden 覆盖，本次消融测不出它的贡献——**uplift 未知 ≠ uplift 为零**，先补覆盖度（第 5 章），再谈废弃（第 23 章）。

## 说明

- 臂之间的隔离靠 git worktree 的独立目录 + agent 只读臂目录实现；`materialize.ts` 在裁剪后会同步剔除 `llms.txt` 里指向已卸载文件的条目——否则测出来的是"坏索引"而不是"缺知识"。
- mock agent 的兜底不稳定用带种子的确定性伪随机数模拟（同一命令跑一万次输出相同）；trials=5 只为演示，真 agent 采样数要按第 22 章的成本预算取。
- 生产接真 agent：把 `src/agent.ts` 的 `answerQuestion` 换成对你的 agent CLI 的一次调用（如 `claude -p "<question>"`），cwd 锁在臂目录即可，其余打分与归因逻辑不变。
