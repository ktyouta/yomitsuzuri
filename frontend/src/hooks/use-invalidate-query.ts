import { QueryKey, useQueryClient } from "@tanstack/react-query";

export function useInvalidateQuery(key: QueryKey) {

    const queryClient = useQueryClient();

    /**
     * 再取得のトリガー
     */
    function invalidate() {
        queryClient.invalidateQueries({ queryKey: key });
    };

    return { invalidate };
}