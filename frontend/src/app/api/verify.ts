import { rpc } from "@/lib/rpc-client";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { InferResponseType } from 'hono/client';
import { verifyKeys } from "./query-key";

const endpoint = rpc.api.v1.verify.$get;

// ログインユーザー情報
export type LoginUserType = InferResponseType<typeof endpoint, 200>['data']['userInfo'];

/**
 * 認証チェック
 * @param props
 * @returns
 */
export function verify() {

    return useSuspenseQuery({
        queryKey: verifyKeys.all,
        queryFn: async () => {
            try {
                const res = await endpoint();
                if (!res.ok) {
                    return null;
                }
                return res.json();
            } catch {
                return null;
            }
        },
    });
}