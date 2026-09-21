import { verifyKeys } from "@/app/api/query-key";
import { useQueryClient } from "@tanstack/react-query";

export function useClearSessionCache() {

    // QueryClientインスタンス
    const queryClient = useQueryClient();

    /**
     * 前セッションのキャッシュ（他ユーザーのデータ・エラー）を除去する
     * 認証チェック（verify）はアプリ全体で継続利用するため残す
     */
    function clearSessionCache() {
        queryClient.removeQueries({
            predicate: (query) => query.queryKey[0] !== verifyKeys.all[0],
        });
    }

    return { clearSessionCache };
}
