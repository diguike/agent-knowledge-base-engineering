// 臂物化：git worktree 从同一基线 commit 切出 N 个互相隔离的工作区，再按挂载矩阵裁剪。
// 用 worktree 而非原地删文件，臂之间互不污染、跑完即弃、基线仓库永远干净。
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Arm } from './arms';

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' });
}

// 把 fixture 复制为一个真正的 git 仓库并提交基线 commit（生产中这就是你的业务仓库本身）。
export function buildBaseRepo(fixtureDir: string, workRoot: string): string {
  const base = path.join(workRoot, 'base');
  fs.cpSync(fixtureDir, base, { recursive: true });
  git(base, 'init', '-q');
  git(base, 'config', 'user.name', 'ablation-harness');
  git(base, 'config', 'user.email', 'ablation@example.invalid');
  git(base, 'add', '.');
  git(base, 'commit', '-q', '-m', 'baseline');
  return base;
}

export function materializeArm(base: string, workRoot: string, arm: Arm): string {
  const armDir = path.join(workRoot, 'arms', arm.name);
  git(base, 'worktree', 'add', '--detach', '-q', armDir, 'HEAD');

  // 按挂载矩阵裁剪
  for (const p of arm.unmount) {
    fs.rmSync(path.join(armDir, p), { recursive: true, force: true });
  }

  // 索引一致性：llms.txt 里指向已卸载文件的条目必须同步剔除，
  // 否则 agent 会拿着索引去读一个不存在的文件——那测的是坏索引，不是缺知识。
  const idx = path.join(armDir, 'llms.txt');
  if (fs.existsSync(idx)) {
    const kept = fs
      .readFileSync(idx, 'utf-8')
      .split('\n')
      .filter((line) => {
        const m = line.match(/\(([^)]+\.md)\)/);
        return !m || fs.existsSync(path.join(armDir, m[1]));
      })
      .join('\n');
    fs.writeFileSync(idx, kept);
  }
  return armDir;
}

export function cleanup(base: string, workRoot: string): void {
  const armsDir = path.join(workRoot, 'arms');
  if (fs.existsSync(armsDir)) {
    for (const name of fs.readdirSync(armsDir)) {
      try {
        git(base, 'worktree', 'remove', '--force', path.join(armsDir, name));
      } catch {
        /* 已删则忽略 */
      }
    }
  }
  fs.rmSync(workRoot, { recursive: true, force: true });
}
