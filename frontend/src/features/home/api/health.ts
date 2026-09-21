import { rpc } from '@/lib/rpc-client';
import { useQuery } from '@tanstack/react-query';
import { healthKeys } from './query-key';

/**
 * ヘルスチェックAPI呼び出し hook
 * RPC クライアントを使用した型安全なAPI呼び出し
 */
export function useHealthQuery() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: async () => {
      const res = await rpc.api.v1.health.$get();
      if (!res.ok) {
        throw new Error('Health check failed');
      }
      return res.json();
    },
  });
}
