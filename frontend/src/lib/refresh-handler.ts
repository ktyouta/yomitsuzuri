import { apiPaths } from '@/config/api-paths';
import { env } from '@/config/env';
import { accessTokenRef, resetAccessToken, resetLogin, updateAccessToken } from '@/stores/access-token-store';
import { default as Axios } from 'axios';

type QueueItem = {
  resolve: (accessToken: string) => void;
  reject: (reason?: unknown) => void;
};

const refreshApi = Axios.create({
  baseURL: env.API_URL,
});

let isRefreshing = false;
let queue: QueueItem[] = [];

/**
 * リフレッシュ完了を待つ
 * 既にリフレッシュ中の場合、キューに追加して完了を待機する
 */
function waitForRefresh(): Promise<string> {
  return new Promise((resolve, reject) => {
    queue.push({ resolve, reject });
  });
}

/**
 * キューに溜まったリクエストを解決する
 */
function resolveQueue(accessToken: string): void {
  const currentQueue = [...queue];
  queue = [];
  currentQueue.forEach(cb => cb.resolve(accessToken));
}

/**
 * キューに溜まったリクエストを拒否する
 */
function rejectQueue(error: unknown): void {
  const currentQueue = [...queue];
  queue = [];
  currentQueue.forEach(cb => cb.reject(error));
}

/**
 * トークンリフレッシュを実行し、新しいアクセストークンを返す
 * 同時に複数のリフレッシュが走らないようキューイングで制御する
 */
export async function handleRefresh(): Promise<string> {
  if (isRefreshing) {
    return waitForRefresh();
  }

  isRefreshing = true;

  try {
    const res = await refreshApi.post(
      apiPaths.refresh,
      {},
      { withCredentials: true },
    );

    const newAccessToken: string = res.data.data;
    updateAccessToken(newAccessToken);
    resolveQueue(newAccessToken);

    return newAccessToken;
  } catch (err) {
    resetAccessToken();
    resetLogin();
    rejectQueue(err);

    throw err;
  } finally {
    isRefreshing = false;
  }
}

/**
 * 現在のアクセストークンを取得する
 */
export function getAccessToken(): string | null {
  return accessTokenRef;
}
