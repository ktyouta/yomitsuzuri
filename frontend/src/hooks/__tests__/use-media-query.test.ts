import { renderHook, act } from "@testing-library/react";
import { describe, expect, vi, beforeEach, afterEach } from "vitest";
import { useMediaQuery, mediaQuery } from "../use-media-query";

describe("useMediaQuery", () => {

    let mockMatchMedia: ReturnType<typeof vi.fn>;
    let mockMql: {
        matches: boolean;
        media: string;
        onchange: ((e: { matches: boolean }) => void) | null;
    };

    beforeEach(() => {
        mockMql = {
            matches: false,
            media: "(width <= 768px)",
            onchange: null,
        };

        mockMatchMedia = vi.fn().mockImplementation((query: string) => {
            mockMql.media = query;
            return mockMql;
        });

        Object.defineProperty(window, "matchMedia", {
            value: mockMatchMedia,
            writable: true,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("should return initial match state as false", () => {

        mockMql.matches = false;

        const { result } = renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(result.current).toBe(false);
    });

    test("should return initial match state as true when matches", () => {

        mockMql.matches = true;

        const { result } = renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(result.current).toBe(true);
    });

    test("should format query correctly with parentheses", () => {

        renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(mockMatchMedia).toHaveBeenCalledWith("(width <= 768px)");
    });

    test("should update match state when media query changes", () => {

        mockMql.matches = false;

        const { result } = renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(result.current).toBe(false);

        // メディアクエリの変更をシミュレート
        act(() => {
            if (mockMql.onchange) {
                mockMql.onchange({ matches: true });
            }
        });

        expect(result.current).toBe(true);
    });

    test("should cleanup onchange handler on unmount", () => {

        const { unmount } = renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(mockMql.onchange).not.toBeNull();

        unmount();

        expect(mockMql.onchange).toBeNull();
    });

    test("should log error for invalid media query", () => {

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // matchMediaが"not all"を返すようにモックを設定
        mockMatchMedia.mockImplementation(() => ({
            matches: false,
            media: "not all",
            onchange: null,
        }));

        renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(consoleSpy).toHaveBeenCalledWith("useMediaQuery Error: Invalid media query");

        consoleSpy.mockRestore();
    });

    test("should log error for 'invalid' media", () => {

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        // matchMediaが"invalid"を返すようにモックを設定
        mockMatchMedia.mockImplementation(() => ({
            matches: false,
            media: "invalid",
            onchange: null,
        }));

        renderHook(() => useMediaQuery(mediaQuery.mobile));

        expect(consoleSpy).toHaveBeenCalledWith("useMediaQuery Error: Invalid media query");

        consoleSpy.mockRestore();
    });

    test("should work with different media query types", () => {

        mockMql.matches = true;

        const { result: mobileResult } = renderHook(() => useMediaQuery(mediaQuery.mobile));
        expect(mobileResult.current).toBe(true);

        const { result: tabletResult } = renderHook(() => useMediaQuery(mediaQuery.tablet));
        expect(mockMatchMedia).toHaveBeenCalledWith("(768px <= width < 1024px)");

        const { result: pcResult } = renderHook(() => useMediaQuery(mediaQuery.pc));
        expect(mockMatchMedia).toHaveBeenCalledWith("(1024px <= width)");

        const { result: pcLessResult } = renderHook(() => useMediaQuery(mediaQuery.pcLess));
        expect(mockMatchMedia).toHaveBeenCalledWith("(width < 1024px)");
    });

    test("should re-setup listener when query changes", () => {

        type MediaQueryType = typeof mediaQuery[keyof typeof mediaQuery];

        const { rerender } = renderHook(
            ({ query }: { query: MediaQueryType }) => useMediaQuery(query),
            { initialProps: { query: mediaQuery.mobile as MediaQueryType } }
        );

        const firstOnchange = mockMql.onchange;

        rerender({ query: mediaQuery.pc });

        // クリーンアップと再設定が行われている
        expect(mockMatchMedia).toHaveBeenCalledWith("(1024px <= width)");
    });
});

describe("mediaQuery constants", () => {

    test("should have correct mobile query", () => {
        expect(mediaQuery.mobile).toBe("width <= 768px");
    });

    test("should have correct tablet query", () => {
        expect(mediaQuery.tablet).toBe("768px <= width < 1024px");
    });

    test("should have correct pc query", () => {
        expect(mediaQuery.pc).toBe("1024px <= width");
    });

    test("should have correct pcLess query", () => {
        expect(mediaQuery.pcLess).toBe("width < 1024px");
    });
});
