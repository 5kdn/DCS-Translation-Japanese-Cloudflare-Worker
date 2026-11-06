import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

/**
 * API本体を先にデプロイし、成功した場合だけビルド済みの転送Workerをデプロイする。
 * シークレットはAPI本体にのみ渡す。
 *
 * @param {string[]} args --dry-run、--secrets-fileを受け付けるCLI引数。
 * @param {typeof spawnSync} [run=spawnSync] デプロイコマンドを同期実行する関数。
 * @returns {number} 両方の成功時は0、失敗時は終了コード（取得できなければ1）。
 * @throws {Error} 引数が不正な場合、またはプロセスの起動に失敗した場合。
 */
export function deploy(args, run = spawnSync) {
  const { values } = parseArgs({
    args,
    options: {
      'dry-run': { type: 'boolean' },
      'secrets-file': { type: 'string' },
    },
  });
  const cli = fileURLToPath(new URL('../node_modules/cf/bin/cf', import.meta.url));
  const common = values['dry-run'] ? ['--dry-run'] : [];
  const secrets = values['secrets-file'] ? ['--secrets-file', values['secrets-file']] : [];

  for (const flags of [
    [...common, ...secrets],
    ['--prebuilt', '--worker', 'api', ...common],
  ]) {
    const result = run(process.execPath, [cli, 'deploy', ...flags], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) return result.status ?? 1;
  }
  return 0;
}

if (import.meta.main) process.exitCode = deploy(process.argv.slice(2));
