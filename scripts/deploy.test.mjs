import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploy } from './deploy.mjs';

test('通常のデプロイでAPI本体と転送Workerを順番に更新する', () => {
  const calls = [];
  const status = deploy(['--secrets-file', '/tmp/secrets.json'], (_command, args) => {
    calls.push(args.slice(1));
    return { status: 0 };
  });
  assert.equal(status, 0);
  assert.deepEqual(calls, [
    ['deploy', '--secrets-file', '/tmp/secrets.json'],
    ['deploy', '--prebuilt', '--worker', 'api'],
  ]);
});

test('dry-runを両Workerに適用する', () => {
  const calls = [];
  deploy(['--dry-run'], (_command, args) => {
    calls.push(args.slice(1));
    return { status: 0 };
  });
  assert.deepEqual(calls, [
    ['deploy', '--dry-run'],
    ['deploy', '--prebuilt', '--worker', 'api', '--dry-run'],
  ]);
});

test('API本体の失敗時は転送Workerを更新せず失敗を返す', () => {
  let calls = 0;
  assert.equal(
    deploy([], () => {
      calls++;
      return { status: 2 };
    }),
    2,
  );
  assert.equal(calls, 1);
});

test('転送Workerの失敗も成功扱いにしない', () => {
  let calls = 0;
  assert.equal(
    deploy([], () => ({ status: ++calls === 1 ? 0 : 3 })),
    3,
  );
});
