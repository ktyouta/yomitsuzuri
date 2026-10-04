import { renderHook, act } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { useDelayedFlag } from "../use-delayed-flag";

const DELAY_MS = 300;

describe("useDelayedFlag", () => {

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("should return false while flag is false", () => {

        const { result } = renderHook(() => useDelayedFlag(false, DELAY_MS));

        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });

        expect(result.current).toBe(false);
    });

    test("should stay false until the delay elapses after flag becomes true", () => {

        const { result } = renderHook(() => useDelayedFlag(true, DELAY_MS));

        act(() => {
            vi.advanceTimersByTime(DELAY_MS - 1);
        });

        expect(result.current).toBe(false);
    });

    test("should become true after the delay elapses", () => {

        const { result } = renderHook(() => useDelayedFlag(true, DELAY_MS));

        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });

        expect(result.current).toBe(true);
    });

    test("should return false immediately when flag becomes false", () => {

        const { result, rerender } = renderHook(
            ({ flag }) => useDelayedFlag(flag, DELAY_MS),
            { initialProps: { flag: true } }
        );

        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });
        expect(result.current).toBe(true);

        rerender({ flag: false });

        expect(result.current).toBe(false);
    });

    test("should not commit true in any render after flag becomes false", () => {

        // 画面に反映（コミット）された値の記録
        const committedValues: boolean[] = [];
        const { rerender } = renderHook(
            ({ flag }) => {
                const value = useDelayedFlag(flag, DELAY_MS);
                useEffect(() => {
                    committedValues.push(value);
                });
                return value;
            },
            { initialProps: { flag: true } }
        );

        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });
        const countBeforeReset = committedValues.length;

        rerender({ flag: false });

        expect(committedValues.slice(countBeforeReset)).toEqual([false]);
    });

    test("should not become true when flag returns to false before the delay elapses", () => {

        const { result, rerender } = renderHook(
            ({ flag }) => useDelayedFlag(flag, DELAY_MS),
            { initialProps: { flag: true } }
        );

        act(() => {
            vi.advanceTimersByTime(DELAY_MS - 1);
        });
        rerender({ flag: false });
        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });

        expect(result.current).toBe(false);
    });

    test("should wait for the delay again when flag becomes true a second time", () => {

        const { result, rerender } = renderHook(
            ({ flag }) => useDelayedFlag(flag, DELAY_MS),
            { initialProps: { flag: true } }
        );

        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });
        rerender({ flag: false });
        rerender({ flag: true });

        expect(result.current).toBe(false);

        act(() => {
            vi.advanceTimersByTime(DELAY_MS);
        });

        expect(result.current).toBe(true);
    });
});
