import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";
import { useHome } from "./use-home";

// count の検証に health API は不要なため、通信しないようモックする
vi.mock("../api/health", () => ({
    useHealthQuery: () => ({
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    }),
}));

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

describe("useHome", () => {

    test("should initialize count to 0", () => {

        const { result } = renderHook(() => useHome(), { wrapper: createWrapper() });

        expect(result.current.count).toBe(0);
    });

    test("should increment count by 1 when click is called", () => {

        const { result } = renderHook(() => useHome(), { wrapper: createWrapper() });

        act(() => {
            result.current.click();
        });

        expect(result.current.count).toBe(1);
    });

    test("should increment count by the number of times click is called", () => {

        const { result } = renderHook(() => useHome(), { wrapper: createWrapper() });

        act(() => {
            result.current.click();
            result.current.click();
            result.current.click();
        });

        expect(result.current.count).toBe(3);
    });
});
