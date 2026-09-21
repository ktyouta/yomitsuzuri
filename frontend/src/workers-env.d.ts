/**
 * フロントの tsc は RPC の型解決のためにバックエンドのソースも型チェックする。
 * その際、DOM の SubtleCrypto には Cloudflare Workers 固有の timingSafeEqual が存在しないため、
 * バックエンド（user-password.ts）の呼び出しがエラーになる。これを防ぐために宣言を補う。
 * フロントのコードからは使用しない。
 */
interface SubtleCrypto {
  timingSafeEqual(
    a: ArrayBuffer | ArrayBufferView,
    b: ArrayBuffer | ArrayBufferView,
  ): boolean;
}
