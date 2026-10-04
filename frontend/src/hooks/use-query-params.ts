import { useState } from "react";

/**
 * 初回レンダー時の URL クエリパラメータを取得する
 * @returns クエリパラメータ（存在しないキーは空文字を返す）
 */
export function useQueryParams() {

    // 初回レンダー時のクエリパラメータ（再レンダーしても初回の値を保持する）
    const [params] = useState(() => {
        const initialParams: Record<string, string> = {};
        new URLSearchParams(window.location.search).forEach((value, key) => {
            initialParams[key] = value;
        });

        return new Proxy(initialParams, {
            get(target, key: string) {
                // 存在しないクエリキーが指定された際は空文字を返す
                return target[key] ?? ``;
            },
        });
    });

    return params;
}
