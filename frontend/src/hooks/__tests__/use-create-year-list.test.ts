import { renderHook } from "@testing-library/react";
import { describe, expect, vi, beforeEach, afterEach } from "vitest";
import { useCreateYearList, MIN_YEAR } from "../use-create-year-list";

describe("useCreateYearList", () => {

    const MOCK_YEAR = 2024;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(MOCK_YEAR, 0, 1));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("should return an array of year objects", () => {

        const { result } = renderHook(() => useCreateYearList());

        expect(Array.isArray(result.current)).toBe(true);
        expect(result.current.length).toBeGreaterThan(0);
    });

    test("should start from MIN_YEAR (1900)", () => {

        const { result } = renderHook(() => useCreateYearList());

        const firstItem = result.current[0];
        expect(firstItem.label).toBe(MIN_YEAR.toString());
        expect(firstItem.value).toBe(MIN_YEAR.toString());
    });

    test("should end with the current year", () => {

        const { result } = renderHook(() => useCreateYearList());

        const lastItem = result.current[result.current.length - 1];
        expect(lastItem.label).toBe(MOCK_YEAR.toString());
        expect(lastItem.value).toBe(MOCK_YEAR.toString());
    });

    test("should return correct number of years", () => {

        const { result } = renderHook(() => useCreateYearList());

        const expectedLength = MOCK_YEAR - MIN_YEAR + 1;
        expect(result.current.length).toBe(expectedLength);
    });

    test("each item should have label and value as string", () => {

        const { result } = renderHook(() => useCreateYearList());

        result.current.forEach((item) => {
            expect(typeof item.label).toBe("string");
            expect(typeof item.value).toBe("string");
            expect(item.label).toBe(item.value);
        });
    });

    test("should return years in ascending order", () => {

        const { result } = renderHook(() => useCreateYearList());

        for (let i = 1; i < result.current.length; i++) {
            const prevYear = parseInt(result.current[i - 1].value);
            const currYear = parseInt(result.current[i].value);
            expect(currYear).toBe(prevYear + 1);
        }
    });

    test("should return memoized value on re-render", () => {

        const { result, rerender } = renderHook(() => useCreateYearList());

        const firstResult = result.current;
        rerender();
        const secondResult = result.current;

        expect(firstResult).toBe(secondResult);
    });
});
