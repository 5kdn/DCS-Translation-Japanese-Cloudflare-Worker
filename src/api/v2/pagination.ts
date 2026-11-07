/**
 * IssueとPRの一覧で共有する、作成日時・番号を境界としたkeysetページング。
 * @packageDocumentation
 */
import { getRequiredEnvString } from '@/helpers/environmentHelper';
import type { GitHubContext } from '@/services/githubService';
import type { Bindings } from '@/types/env';
import { type Boundary, issueCursor, type PageConditions, readCursor } from './cursor';
import { getGitHubContext, githubRequest } from './githubAdapter';

/** GitHubのIssue一覧とPR一覧に共通する、ページ取得時の条件。 */
type ListParameters = {
  owner: string;
  repo: string;
  state: PageConditions['state'];
  per_page: 100;
  page: number;
  sort: 'created';
  direction: 'desc';
};
/** GitHub側の件数・作成日時と、リソース固有の除外・変換後の項目。 */
type PageData<T> = { count: number; dates: string[]; items: T[] };
/** 作成日時の降順で比較し、同一日時では番号の降順にする。 */
const compare = (a: Boundary, b: Boundary): number => b.createdAt.localeCompare(a.createdAt) || b.number - a.number;

/**
 * GitHubのページ番号を公開せず、署名付きcursorで次ページを取得できる一覧を返す。
 * 同一作成日時の項目がGitHubのページをまたぐ場合も、番号順を確定するまで取得する。
 * @param env GitHub Appの設定を含むWorkerのバインディング。
 * @param resource cursorを結び付けるリソース種別。
 * @param query 検証済みの取得条件。stateはopen、limitは20が既定値。
 * @param loadPage リソース固有のGitHub取得・検証・応答変換。
 * @returns 最大limit件の項目と、後続項目があれば次ページのcursor。
 * @throws {ProblemException} cursorの検証に失敗した場合は400 INVALID_CURSOR。
 * @throws {HTTPException} GitHubの障害・不正応答は502、利用不可・回数制限は503。
 */
export const paginate = async <T extends Boundary>(
  env: Bindings,
  resource: PageConditions['resource'],
  query: { state?: PageConditions['state']; limit?: number; cursor?: string },
  loadPage: (ctx: GitHubContext, params: ListParameters) => Promise<PageData<T>>,
): Promise<{ items: T[]; page: { nextCursor: string | null } }> => {
  const conditions: PageConditions = { resource, state: query.state ?? 'open', limit: query.limit ?? 20 };
  const secret = `${env.TARGET_GH_OWNER}/${env.TARGET_GH_REPO}\n${getRequiredEnvString('TARGET_GH_APP_PRIVATE_KEY', env.TARGET_GH_APP_PRIVATE_KEY)}`;
  const boundary = query.cursor ? await readCursor(query.cursor, conditions, secret) : undefined;
  const ctx = await getGitHubContext(env);
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const params: ListParameters = {
      owner: ctx.owner,
      repo: ctx.repo,
      state: conditions.state,
      per_page: 100,
      page,
      sort: 'created',
      direction: 'desc',
    };
    const data = await githubRequest(() => loadPage(ctx, params));
    for (const item of data.items) {
      if ((!boundary || compare(item, boundary) > 0) && !items.some((entry) => entry.number === item.number)) items.push(item);
    }
    items.sort(compare);
    items.splice(conditions.limit + 1);
    const cutoff = items[conditions.limit - 1];
    // 同一作成日時がGitHubのページをまたぐ場合は、番号順を確定できるまで読む。
    if (data.count < 100 || (items.length > conditions.limit && cutoff && data.dates.some((date) => date < cutoff.createdAt)))
      break;
  }
  const selected = items.slice(0, conditions.limit);
  const last = selected.at(-1);
  return {
    items: selected,
    page: { nextCursor: items.length > conditions.limit && last ? await issueCursor(conditions, last, secret) : null },
  };
};
