/**
 * 読書状況コードの一覧
 */
export const BOOK_READING_STATUSES = ["unread", "reading", "finished"] as const;

/**
 * 読書状況コード
 */
export type BookReadingStatus = typeof BOOK_READING_STATUSES[number];
