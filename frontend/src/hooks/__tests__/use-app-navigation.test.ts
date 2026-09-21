import { renderHook, act } from "@testing-library/react";
import { describe, expect, vi, beforeEach, Mock } from "vitest";
import { useAppNavigation } from "../use-app-navigation";
import { navigationDepth } from "@/stores/navigation-depth-store";

// react-router-dom のモック
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// navigationDepth のモック
vi.mock("@/stores/navigation-depth-store", () => ({
    navigationDepth: {
        increment: vi.fn(),
        decrement: vi.fn(),
        canGoBack: vi.fn(),
    },
}));

describe("useAppNavigation", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("appNavigate", () => {

        test("should call navigationDepth.increment and navigate to the specified path", () => {

            const { result } = renderHook(() => useAppNavigation());

            act(() => {
                result.current.appNavigate("/test-path");
            });

            expect(navigationDepth.increment).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith("/test-path");
        });

        test("should handle different paths correctly", () => {

            const { result } = renderHook(() => useAppNavigation());

            act(() => {
                result.current.appNavigate("/users/123");
            });

            expect(mockNavigate).toHaveBeenCalledWith("/users/123");

            act(() => {
                result.current.appNavigate("/settings");
            });

            expect(mockNavigate).toHaveBeenCalledWith("/settings");
        });
    });

    describe("appGoBack", () => {

        test("should go back when canGoBack returns true", () => {

            (navigationDepth.canGoBack as Mock).mockReturnValue(true);

            const { result } = renderHook(() => useAppNavigation());

            act(() => {
                result.current.appGoBack("/default");
            });

            expect(navigationDepth.canGoBack).toHaveBeenCalled();
            expect(navigationDepth.decrement).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });

        test("should navigate to default path when canGoBack returns false", () => {

            (navigationDepth.canGoBack as Mock).mockReturnValue(false);

            const { result } = renderHook(() => useAppNavigation());

            act(() => {
                result.current.appGoBack("/home");
            });

            expect(navigationDepth.canGoBack).toHaveBeenCalled();
            expect(navigationDepth.decrement).not.toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/home");
        });

        test("should use different default paths correctly", () => {

            (navigationDepth.canGoBack as Mock).mockReturnValue(false);

            const { result } = renderHook(() => useAppNavigation());

            act(() => {
                result.current.appGoBack("/dashboard");
            });

            expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
        });
    });

    describe("return value", () => {

        test("should return appNavigate and appGoBack functions", () => {

            const { result } = renderHook(() => useAppNavigation());

            expect(typeof result.current.appNavigate).toBe("function");
            expect(typeof result.current.appGoBack).toBe("function");
        });
    });
});
