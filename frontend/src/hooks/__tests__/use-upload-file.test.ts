import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, vi, beforeEach, Mock } from "vitest";
import { useUploadFile } from "../use-upload-file";
import { api } from "@/lib/api-client";

// api のモック
vi.mock("@/lib/api-client", () => ({
    api: {
        post: vi.fn(),
    },
}));

describe("useUploadFile", () => {

    const mockUrl = "/api/upload";

    beforeEach(() => {
        vi.clearAllMocks();
    });

    function createMockFile(
        name: string,
        size: number,
        type: string
    ): File {
        const content = new Array(size).fill("a").join("");
        return new File([content], name, { type });
    }

    describe("initial state", () => {

        test("should return isLoading as false initially", () => {

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            expect(result.current.isLoading).toBe(false);
        });

        test("should return upload function", () => {

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            expect(typeof result.current.upload).toBe("function");
        });
    });

    describe("successful upload", () => {

        test("should upload file successfully", async () => {

            const mockResponse = { data: { id: 1, filename: "test.jpg" } };
            (api.post as Mock).mockResolvedValue(mockResponse);

            const onSuccess = vi.fn();

            const { result } = renderHook(() =>
                useUploadFile({
                    url: mockUrl,
                    onSuccess,
                })
            );

            const file = createMockFile("test.jpg", 1024, "image/jpeg");

            await act(async () => {
                await result.current.upload(file);
            });

            expect(api.post).toHaveBeenCalledWith(
                mockUrl,
                expect.any(FormData),
                expect.objectContaining({
                    withCredentials: true,
                })
            );
            expect(onSuccess).toHaveBeenCalledWith(mockResponse);
        });

        test("should set isLoading to true during upload", async () => {

            let resolvePromise: (value: unknown) => void;
            const promise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
            (api.post as Mock).mockReturnValue(promise);

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            const file = createMockFile("test.jpg", 1024, "image/jpeg");

            act(() => {
                result.current.upload(file);
            });

            expect(result.current.isLoading).toBe(true);

            await act(async () => {
                resolvePromise!({ data: {} });
            });

            expect(result.current.isLoading).toBe(false);
        });

        test("should call onUploadProgress callback", async () => {

            (api.post as Mock).mockImplementation((url, data, config) => {
                // onUploadProgress コールバックを呼び出す
                if (config?.onUploadProgress) {
                    config.onUploadProgress({ loaded: 50, total: 100 });
                }
                return Promise.resolve({ data: {} });
            });

            const onUploadProgress = vi.fn();

            const { result } = renderHook(() =>
                useUploadFile({
                    url: mockUrl,
                    onUploadProgress,
                })
            );

            const file = createMockFile("test.jpg", 1024, "image/jpeg");

            await act(async () => {
                await result.current.upload(file);
            });

            expect(onUploadProgress).toHaveBeenCalledWith({ loaded: 50, total: 100 });
        });
    });

    describe("file validation", () => {

        test("should reject file with invalid type", async () => {

            const onError = vi.fn();

            const { result } = renderHook(() =>
                useUploadFile({
                    url: mockUrl,
                    onError,
                })
            );

            const file = createMockFile("test.exe", 1024, "application/x-executable");

            await expect(
                act(async () => {
                    await result.current.upload(file);
                })
            ).rejects.toThrow("許可されていないファイル形式です。");

            expect(onError).toHaveBeenCalled();
            expect(api.post).not.toHaveBeenCalled();
        });

        test("should reject file exceeding size limit for avatar", async () => {

            const onError = vi.fn();

            const { result } = renderHook(() =>
                useUploadFile({
                    url: mockUrl,
                    onError,
                })
            );

            // 2MB超過のファイル
            const file = createMockFile("test.jpg", 3 * 1024 * 1024, "image/jpeg");

            await expect(
                act(async () => {
                    await result.current.upload(file);
                })
            ).rejects.toThrow("ファイルサイズが大きすぎます。上限: 2MB");

            expect(onError).toHaveBeenCalled();
        });

        test("should reject file exceeding size limit for document", async () => {

            const onError = vi.fn();

            const { result } = renderHook(() =>
                useUploadFile({
                    url: mockUrl,
                    onError,
                })
            );

            // 10MB超過のファイル
            const file = createMockFile("test.pdf", 11 * 1024 * 1024, "application/pdf");

            await expect(
                act(async () => {
                    await result.current.upload(file);
                })
            ).rejects.toThrow("ファイルサイズが大きすぎます。上限: 10MB");

            expect(onError).toHaveBeenCalled();
        });

        test("should accept valid image file", async () => {

            (api.post as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            const file = createMockFile("test.png", 1024, "image/png");

            await act(async () => {
                await result.current.upload(file);
            });

            expect(api.post).toHaveBeenCalled();
        });

        test("should accept valid webp image", async () => {

            (api.post as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            const file = createMockFile("test.webp", 1024, "image/webp");

            await act(async () => {
                await result.current.upload(file);
            });

            expect(api.post).toHaveBeenCalled();
        });

        test("should accept valid PDF file", async () => {

            (api.post as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            const file = createMockFile("test.pdf", 1024, "application/pdf");

            await act(async () => {
                await result.current.upload(file);
            });

            expect(api.post).toHaveBeenCalled();
        });

        test("should accept valid CSV file", async () => {

            (api.post as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            const file = createMockFile("test.csv", 1024, "text/csv");

            await act(async () => {
                await result.current.upload(file);
            });

            expect(api.post).toHaveBeenCalled();
        });
    });

    describe("error handling", () => {

        test("should call onError and throw on API error", async () => {

            const apiError = new Error("Network Error");
            (api.post as Mock).mockRejectedValue(apiError);

            const onError = vi.fn();

            const { result } = renderHook(() =>
                useUploadFile({
                    url: mockUrl,
                    onError,
                })
            );

            const file = createMockFile("test.jpg", 1024, "image/jpeg");

            await expect(
                act(async () => {
                    await result.current.upload(file);
                })
            ).rejects.toThrow("Network Error");

            expect(onError).toHaveBeenCalledWith(apiError);
        });

        test("should set isLoading to false after error", async () => {

            (api.post as Mock).mockRejectedValue(new Error("Error"));

            const { result } = renderHook(() =>
                useUploadFile({ url: mockUrl })
            );

            const file = createMockFile("test.jpg", 1024, "image/jpeg");

            try {
                await act(async () => {
                    await result.current.upload(file);
                });
            } catch {
                // エラーを無視
            }

            expect(result.current.isLoading).toBe(false);
        });
    });
});
