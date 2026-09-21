import { hc } from 'hono/client';
import type { AppType } from '@backend/rpc';
import { env } from '@/config/env';
import { getAccessToken, handleRefresh } from '@/lib/refresh-handler';

/**
 * 通信エラー発生時の疑似エラーレスポンスを生成する
 * 各featureのエラーハンドリング（!res.ok → res.json() → message表示）をそのまま利用できるようにする
 */
function createConnectionErrorResponse(): Response {
  return new Response(
    JSON.stringify({ message: '通信エラーが発生しました。しばらくしてから再度お試しください。' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } },
  );
}

/**
 * fetch を実行し、通信エラー時は疑似エラーレスポンスを返す
 */
async function fetchOrConnectionError(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    // 通信エラー（サーバーダウン・オフライン等）
    return createConnectionErrorResponse();
  }
}

/**
 * 401時にリフレッシュ・リトライを行うカスタムfetch
 */
async function fetchWithRefresh(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {

  const headers = new Headers(init?.headers);

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetchOrConnectionError(input, { ...init, headers });

  if (response.status !== 401) {
    return response;
  }

  // 401: リフレッシュ後にリトライ
  let newAccessToken: string;
  try {
    newAccessToken = await handleRefresh();
  } catch {
    // リフレッシュ失敗時は元の401レスポンスを返す
    return response;
  }

  headers.set('Authorization', `Bearer ${newAccessToken}`);
  return fetchOrConnectionError(input, { ...init, headers });
}

/**
 * Hono RPC クライアント
 * バックエンドの型定義から型安全なAPIクライアントを生成
 */
export const rpc = hc<AppType>(env.API_URL, {
  fetch: fetchWithRefresh,
  init: {
    credentials: 'include',
  },
});

/**
 * RPC クライアントの型
 */
export type RpcClient = typeof rpc;
