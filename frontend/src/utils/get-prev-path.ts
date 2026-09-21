/**
 * 前画面のパスを取得
 */
export function getPrevPath(key: string, defaultPath: string) {

    // クエリパラメータ(遷移元情報)
    const queryParam = location.search;

    const keyIndex = queryParam.indexOf(`${key}=`);

    if (keyIndex === -1) {
        return defaultPath;
    }

    const start = keyIndex + `${key}=`.length;

    return queryParam.slice(start) || defaultPath;
};