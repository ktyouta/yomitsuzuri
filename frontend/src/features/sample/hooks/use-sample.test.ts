import { act, renderHook } from "@testing-library/react";
import { describe, expect } from "vitest";
import { useSample } from "./use-sample";

describe("useSample", () => {

    test("should initialize count to 0", () => {

        const { result } = renderHook(() => useSample());

        expect(result.current.count).toBe(0);
    });

    test("should increment count by 1 when click is called", () => {

        const { result } = renderHook(() => useSample());

        act(() => {
            result.current.click();
        });

        expect(result.current.count).toBe(1);
    });

    test("should increment count by the number of times click is called", () => {

        const { result } = renderHook(() => useSample());

        act(() => {
            result.current.click();
            result.current.click();
            result.current.click();
        });

        expect(result.current.count).toBe(3);
    });
});
