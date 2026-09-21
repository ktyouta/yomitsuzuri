/**
 * Blobをファイルとしてダウンロードさせる（aタグdownload）
 * HTTPレスポンス由来のBlobをそのまま渡すこと。文字列に変換してから再度Blob化すると、
 * UTF-8のBOMがデコード時に失われファイルが文字化けするため（Response.text()の仕様）。
 */
export function downloadBlobFile(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
