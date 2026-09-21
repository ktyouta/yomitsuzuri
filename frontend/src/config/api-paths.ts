import { API_ENDPOINT } from '@backend/constant';

/**
 * RPC を経由しない API パス定義
 *
 * 通常の API 呼び出しは RPC クライアント経由で行うため、パス文字列は不要。
 * refresh のみ、RPC クライアント自体がトークンリフレッシュ機構を内包しており
 * 循環参照を避けるため axios で直接通信する例外として残している。
 */
export const apiPaths = {
    refresh: API_ENDPOINT.REFRESH,
} as const;
