export default {
  /**
   * Service Binding経由でAPI本体へ転送し、レスポンスを加工せず返す。
   *
   * @param request URL・ヘッダー・本文を変更せずに転送するリクエスト。
   * @param env API本体へのService Binding。
   * @returns API本体のレスポンス。転送先での失敗はそのまま呼び出し元へ伝播する。
   */
  fetch(request: Request, env: { API: Pick<Fetcher, 'fetch'> }): Promise<Response> {
    return env.API.fetch(request);
  },
};
