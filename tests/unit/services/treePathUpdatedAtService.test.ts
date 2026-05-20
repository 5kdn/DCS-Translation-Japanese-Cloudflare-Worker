import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type TreePathUpdatedAtItem, TreePathUpdatedAtService } from '@/services/treePathUpdatedAtService';

type Statement = {
  bind: ReturnType<typeof vi.fn>;
  run: ReturnType<typeof vi.fn>;
  all: ReturnType<typeof vi.fn>;
};

const makeStatement = (options?: {
  runImpl?: () => Promise<unknown>;
  allImpl?: () => Promise<{ results?: TreePathUpdatedAtItem[] }>;
}) => {
  const statement: Statement = {
    bind: vi.fn(),
    run: vi.fn(),
    all: vi.fn(),
  };
  statement.bind.mockImplementation(() => statement);
  statement.run.mockImplementation(options?.runImpl ?? (async () => ({ results: [] })));
  statement.all.mockImplementation(options?.allImpl ?? (async () => ({ results: [] })));
  return statement;
};

const makeDb = (options?: {
  selectResults?: TreePathUpdatedAtItem[];
  insertRunImpl?: () => Promise<unknown>;
  batchImpl?: (statements: D1PreparedStatement[]) => Promise<unknown>;
  insertStatementFactory?: () => Statement;
}) => {
  const insertStatements: Statement[] = [];
  const selectStatement = makeStatement({
    allImpl: async () => ({ results: options?.selectResults ?? [] }),
  });
  const batch = vi.fn(options?.batchImpl ?? (async () => []));
  const prepare = vi.fn((query: string) => {
    if (query.startsWith('SELECT')) {
      return selectStatement;
    }
    const statement = (options?.insertStatementFactory ?? (() => makeStatement({ runImpl: options?.insertRunImpl })))();
    insertStatements.push(statement);
    return statement;
  });
  const db = { batch, prepare } as unknown as D1Database;
  return { db, batch, prepare, insertStatements, selectStatement };
};

describe('TreePathUpdatedAtService.read', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('readで取得結果をRecordに変換する', async () => {
    const { db, prepare, selectStatement } = makeDb({
      selectResults: [
        { path: 'DCSWorld/a.txt', updated_at: 1 },
        { path: 'UserMissions/b.lua', updated_at: 2 },
      ],
    });
    const service = new TreePathUpdatedAtService(db);

    const result = await service.read();

    expect(result).toEqual({
      'DCSWorld/a.txt': new Date(1),
      'UserMissions/b.lua': new Date(2),
    });
    expect(prepare).toHaveBeenCalledWith('SELECT path, updated_at FROM tree_path_updated_at');
    expect(selectStatement.all).toHaveBeenCalled();
  });
});

describe('TreePathUpdatedAtService.upsert', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('upsertが空配列なら何もしない', async () => {
    const { db, batch, prepare } = makeDb();
    const service = new TreePathUpdatedAtService(db);

    await service.upsert([]);

    expect(batch).not.toHaveBeenCalled();
    expect(prepare).not.toHaveBeenCalled();
  });

  it('upsertがbatchでUPSERTする', async () => {
    const { db, batch, insertStatements } = makeDb();
    const service = new TreePathUpdatedAtService(db);
    const files: TreePathUpdatedAtItem[] = [
      { path: 'DCSWorld/a.txt', updatedAt: 10 },
      { path: 'UserMissions/b.lua', updatedAt: 20 },
    ];

    await service.upsert(files);

    expect(insertStatements).toHaveLength(2);
    expect(insertStatements[0]?.bind).toHaveBeenCalledWith('DCSWorld/a.txt', 10);
    expect(insertStatements[1]?.bind).toHaveBeenCalledWith('UserMissions/b.lua', 20);
    expect(batch).toHaveBeenCalledTimes(1);
    expect(batch).toHaveBeenCalledWith(insertStatements);
  });

  it('upsertが複数件のバインド結果をすべてbatchへ渡す', async () => {
    const { db, batch, insertStatements } = makeDb();
    const service = new TreePathUpdatedAtService(db);
    const files: TreePathUpdatedAtItem[] = [
      { path: 'Mods/first.lua', updatedAt: 100 },
      { path: 'Mods/second.lua', updatedAt: 200 },
      { path: 'Mods/third.lua', updatedAt: 300 },
    ];

    await service.upsert(files);

    expect(insertStatements).toHaveLength(files.length);
    files.forEach((file, index) => {
      expect(insertStatements[index]?.bind).toHaveBeenCalledWith(file.path, file.updatedAt);
    });
    expect(batch).toHaveBeenCalledWith(insertStatements);
  });

  it('upsertで失敗した場合はリトライする', async () => {
    const error = new Error('boom');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { db, batch, insertStatements } = makeDb({
      batchImpl: async () => {
        throw error;
      },
    });
    const service = new TreePathUpdatedAtService(db);

    await expect(service.upsert([{ path: 'DCSWorld/a.txt', updatedAt: 1 }])).rejects.toThrow('boom');

    expect(insertStatements).toHaveLength(3);
    insertStatements.forEach((statement) => {
      expect(statement.bind).toHaveBeenCalledWith('DCSWorld/a.txt', 1);
    });
    expect(batch).toHaveBeenCalledTimes(3);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[d1] tree_path_updated_at.upsert failed after retries', error);
  });
});
