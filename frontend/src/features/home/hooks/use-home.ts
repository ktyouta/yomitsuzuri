import { useState } from "react";
import { useHealthQuery } from "../api/health";

export const useHome = () => {

    const [count, setCount] = useState(0);

    // RPC クライアントを使用した API 呼び出し
    const healthQuery = useHealthQuery();

    const click = () => {
        setCount((prev) => {
            return prev + 1;
        });
    }

    return {
        count,
        click,
        // health API のレスポンス
        healthStatus: healthQuery.data?.data?.status ?? null,
        healthTimestamp: healthQuery.data?.data?.timestamp ?? null,
        isHealthLoading: healthQuery.isLoading,
        isHealthError: healthQuery.isError,
        refetchHealth: healthQuery.refetch,
    }
}
