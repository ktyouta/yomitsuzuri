import { verifyKeys } from "@/app/api/query-key";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, test } from "vitest";
import { useClearSessionCache } from "../use-clear-session-cache";

describe("useClearSessionCache", () => {

    let queryClient: QueryClient;

    function createWrapper() {
        return function Wrapper({ children }: { children: ReactNode }) {
            return (
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            );
        };
    }

    beforeEach(() => {
        queryClient = new QueryClient();
    });

    test("認証チェック以外のキャッシュが除去される", () => {

        queryClient.setQueryData(["sample", "list"], [{ id: 1 }]);
        queryClient.setQueryData(["health"], { status: "healthy" });

        const { result } = renderHook(() => useClearSessionCache(), { wrapper: createWrapper() });

        act(() => {
            result.current.clearSessionCache();
        });

        expect(queryClient.getQueryData(["sample", "list"])).toBeUndefined();
        expect(queryClient.getQueryData(["health"])).toBeUndefined();
    });

    test("認証チェック（verify）のキャッシュは残る", () => {

        queryClient.setQueryData(verifyKeys.all, { data: { userInfo: { id: "1" } } });

        const { result } = renderHook(() => useClearSessionCache(), { wrapper: createWrapper() });

        act(() => {
            result.current.clearSessionCache();
        });

        expect(queryClient.getQueryData(verifyKeys.all)).toEqual({ data: { userInfo: { id: "1" } } });
    });
});
