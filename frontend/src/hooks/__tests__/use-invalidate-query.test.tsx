import { renderHook, act } from "@testing-library/react";
import { describe, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInvalidateQuery } from "../use-invalidate-query";
import { ReactNode } from "react";

describe("useInvalidateQuery", () => {

    let queryClient: QueryClient;
    let invalidateQueriesSpy: ReturnType<typeof vi.spyOn>;

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
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    });

    test("should return invalidate function", () => {

        const { result } = renderHook(
            () => useInvalidateQuery(["test-key"]),
            { wrapper: createWrapper() }
        );

        expect(typeof result.current.invalidate).toBe("function");
    });

    test("should call invalidateQueries with correct key when invalidate is called", () => {

        const queryKey = ["users", "list"];

        const { result } = renderHook(
            () => useInvalidateQuery(queryKey),
            { wrapper: createWrapper() }
        );

        act(() => {
            result.current.invalidate();
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey });
    });

    test("should work with single string key", () => {

        const queryKey = ["single-key"];

        const { result } = renderHook(
            () => useInvalidateQuery(queryKey),
            { wrapper: createWrapper() }
        );

        act(() => {
            result.current.invalidate();
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["single-key"] });
    });

    test("should work with complex key including objects", () => {

        const queryKey = ["users", { id: 123, status: "active" }];

        const { result } = renderHook(
            () => useInvalidateQuery(queryKey),
            { wrapper: createWrapper() }
        );

        act(() => {
            result.current.invalidate();
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey });
    });

    test("should be able to call invalidate multiple times", () => {

        const queryKey = ["test-key"];

        const { result } = renderHook(
            () => useInvalidateQuery(queryKey),
            { wrapper: createWrapper() }
        );

        act(() => {
            result.current.invalidate();
            result.current.invalidate();
            result.current.invalidate();
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
    });

    test("should use the key provided at hook initialization", () => {

        const { result, rerender } = renderHook(
            ({ key }: { key: string[] }) => useInvalidateQuery(key),
            {
                wrapper: createWrapper(),
                initialProps: { key: ["initial-key"] },
            }
        );

        act(() => {
            result.current.invalidate();
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["initial-key"] });

        rerender({ key: ["new-key"] });

        act(() => {
            result.current.invalidate();
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ["new-key"] });
    });
});
