import { renderHook } from "@testing-library/react";
import { describe, expect, vi, beforeEach, afterEach } from "vitest";
import { useQueryParams } from "../use-query-params";

describe("useQueryParams", () => {

    const originalLocation = window.location;

    beforeEach(() => {
        // window.location をモック
        Object.defineProperty(window, "location", {
            value: {
                ...originalLocation,
                search: "",
            },
            writable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(window, "location", {
            value: originalLocation,
            writable: true,
        });
    });

    test("should return empty string for non-existent query key", () => {

        window.location.search = "";

        const { result } = renderHook(() => useQueryParams());

        expect(result.current["nonExistentKey"]).toBe("");
    });

    test("should parse single query parameter", () => {

        window.location.search = "?id=123";

        const { result } = renderHook(() => useQueryParams());

        expect(result.current["id"]).toBe("123");
    });

    test("should parse multiple query parameters", () => {

        window.location.search = "?name=test&page=1&sort=asc";

        const { result } = renderHook(() => useQueryParams());

        expect(result.current["name"]).toBe("test");
        expect(result.current["page"]).toBe("1");
        expect(result.current["sort"]).toBe("asc");
    });

    test("should handle URL encoded values", () => {

        window.location.search = "?search=%E3%83%86%E3%82%B9%E3%83%88";

        const { result } = renderHook(() => useQueryParams());

        expect(result.current["search"]).toBe("テスト");
    });

    test("should handle empty value", () => {

        window.location.search = "?key=";

        const { result } = renderHook(() => useQueryParams());

        expect(result.current["key"]).toBe("");
    });

    test("should handle special characters in value", () => {

        window.location.search = "?filter=a%26b%3Dc";

        const { result } = renderHook(() => useQueryParams());

        expect(result.current["filter"]).toBe("a&b=c");
    });

    test("should preserve params across re-renders using useRef", () => {

        window.location.search = "?id=original";

        const { result, rerender } = renderHook(() => useQueryParams());

        expect(result.current["id"]).toBe("original");

        // URLを変更してもrefは初回の値を保持する
        window.location.search = "?id=changed";
        rerender();

        expect(result.current["id"]).toBe("original");
    });

    test("should return Proxy object", () => {

        window.location.search = "?test=value";

        const { result } = renderHook(() => useQueryParams());

        // Proxyのget trapが動作していることを確認
        expect(result.current["test"]).toBe("value");
        expect(result.current["undefined"]).toBe("");
    });
});
