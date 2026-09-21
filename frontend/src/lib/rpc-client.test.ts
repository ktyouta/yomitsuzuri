import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAccessToken, handleRefresh } from '@/lib/refresh-handler';

vi.mock('@/config/env', () => ({
    env: { API_URL: 'http://localhost:8787' },
}));

vi.mock('@/lib/refresh-handler', () => ({
    getAccessToken: vi.fn(),
    handleRefresh: vi.fn(),
}));

import { rpc } from './rpc-client';

const CONNECTION_ERROR_MESSAGE = '通信エラーが発生しました。しばらくしてから再度お試しください。';

describe('rpc-client', () => {

    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn());
        vi.mocked(getAccessToken).mockReturnValue('old-token');
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.unstubAllGlobals();
    });

    test('バックエンドに接続できない場合、生の例外ではなく503のエラーレスポンスを返す', async () => {

        (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
            new TypeError('Failed to fetch')
        );

        const res = await rpc.api.v1['user-login'].$post({
            json: { name: 'test', password: 'password' },
        });

        expect(res.ok).toBe(false);
        expect(res.status).toBe(503);
        expect(await res.json()).toEqual({ message: CONNECTION_ERROR_MESSAGE });
    });

    test('401後のリトライで通信エラーになった場合、生の例外ではなく503のエラーレスポンスを返す', async () => {

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: '認証エラー' }), { status: 401 }))
            .mockRejectedValueOnce(new TypeError('Failed to fetch'));
        vi.mocked(handleRefresh).mockResolvedValue('new-token');

        const res = await rpc.api.v1.verify.$get();

        expect(res.status).toBe(503);
        expect(await res.json()).toEqual({ message: CONNECTION_ERROR_MESSAGE });
    });

    test('リフレッシュに失敗した場合、元の401レスポンスを返す', async () => {

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: '認証エラー' }), { status: 401 }));
        vi.mocked(handleRefresh).mockRejectedValue(new Error('refresh failed'));

        const res = await rpc.api.v1.verify.$get();

        expect(res.status).toBe(401);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('リフレッシュに成功した場合、新しいトークンでリトライした結果を返す', async () => {

        (global.fetch as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(new Response(JSON.stringify({ message: '認証エラー' }), { status: 401 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ data: {} }), { status: 200 }));
        vi.mocked(handleRefresh).mockResolvedValue('new-token');

        const res = await rpc.api.v1.verify.$get();

        expect(res.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(2);

        const retryInit = vi.mocked(global.fetch).mock.calls[1][1];
        const retryHeaders = new Headers(retryInit?.headers);
        expect(retryHeaders.get('Authorization')).toBe('Bearer new-token');
    });
});
