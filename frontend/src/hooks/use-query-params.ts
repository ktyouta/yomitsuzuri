import { useRef } from "react";

export function useQueryParams() {

    const searchParams = new URLSearchParams(window.location.search);
    const paramsRef = useRef<Record<string, string>>({});

    if (Object.keys(paramsRef.current).length === 0) {
        searchParams.forEach((value, key) => {
            paramsRef.current[key] = value;
        });
    }

    return new Proxy(paramsRef.current, {
        get(target, key: string) {
            // 存在しないクエリキーが指定された際は空文字を返す
            return target[key] ?? ``;
        },
    });
}