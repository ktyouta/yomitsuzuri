import { useTransition } from "react";
import { useSearchParams } from "react-router-dom";

export function useTransitionSearchParams() {

    // クエリパラメータ
    const [searchParams, rawSetSearchParams] = useSearchParams();
    // 遷移中フラグ
    const [isPending, startTransition] = useTransition();

    function setSearchParams(params: Record<string, string>) {
        startTransition(() => rawSetSearchParams(params));
    }

    return [searchParams, setSearchParams, isPending] as const;
}
