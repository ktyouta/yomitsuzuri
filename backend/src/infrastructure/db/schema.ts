import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * サンプルテーブル
 */
export const sample = sqliteTable("sample", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Sample = typeof sample.$inferSelect;
export type NewSample = typeof sample.$inferInsert;

/**
 * ユーザーマスタ
 */
export const userMaster = sqliteTable(
  "user_master",
  {
    id: text("id").primaryKey(), // ULID
    name: text("name").notNull(),
    birthday: text("birthday").notNull(),
    lastLoginDate: text("last_login_date"),
    darkMode: integer("dark_mode", { mode: "boolean" }).notNull().default(false),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // 論理削除済みの行は除外し、退会後に同じユーザー名で再登録できるようにする
    uniqueIndex("user_master_name_unique").on(t.name).where(sql`delete_flg = 0`),
  ]
);

export type UserMaster = typeof userMaster.$inferSelect;
export type NewUserMaster = typeof userMaster.$inferInsert;

/**
 * ユーザーログインマスタ
 */
export const userLoginMaster = sqliteTable(
  "user_login_master",
  {
    id: text("id").primaryKey(), // ULID（ログインレコード自身のID）
    userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "cascade" }), // FK → user_master.id
    loginId: text("login_id").notNull(),
    passwordHash: text("password_hash").notNull(),
    salt: text("salt").notNull(),
    authProvider: text("auth_provider").notNull().default("password"),
    googleId: text("google_id"),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // 論理削除済みの行は除外し、退会後に同じログインIDで再登録できるようにする
    uniqueIndex("user_login_master_login_id_unique").on(t.loginId).where(sql`delete_flg = 0`),
  ]
);

export type UserLoginMaster = typeof userLoginMaster.$inferSelect;
export type NewUserLoginMaster = typeof userLoginMaster.$inferInsert;

/**
 * 書籍トランザクション
 */
export const bookTransaction = sqliteTable(
  "book_transaction",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "no action" }), // FK → user_master.id
    title: text("title").notNull(),
    publishedDate: text("published_date"), // YYYY / YYYY-MM / YYYY-MM-DD のいずれか
    readingStatus: text("reading_status", { enum: ["unread", "reading", "finished"] }).notNull().default("unread"),
    currentPage: integer("current_page"),
    memo: text("memo"),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // book_tag_transaction の複合 FK の参照先にするため（SQLite は参照先に UNIQUE が必要）
    unique("book_transaction_id_user_id_unique").on(t.id, t.userId),
    index("book_transaction_user_id_idx").on(t.userId),
  ]
);

export type BookTransaction = typeof bookTransaction.$inferSelect;
export type NewBookTransaction = typeof bookTransaction.$inferInsert;

/**
 * 作品トランザクション
 */
export const workTransaction = sqliteTable(
  "work_transaction",
  {
    id: text("id").primaryKey(), // ULID
    bookId: text("book_id").notNull().references(() => bookTransaction.id, { onDelete: "no action" }), // FK → book_transaction.id
    title: text("title").notNull(),
    sortOrder: integer("sort_order").notNull(),
    memo: text("memo"),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("work_transaction_book_id_idx").on(t.bookId),
  ]
);

export type WorkTransaction = typeof workTransaction.$inferSelect;
export type NewWorkTransaction = typeof workTransaction.$inferInsert;

/**
 * 登場人物トランザクション
 */
export const characterTransaction = sqliteTable(
  "character_transaction",
  {
    id: text("id").primaryKey(), // ULID
    workId: text("work_id").notNull().references(() => workTransaction.id, { onDelete: "no action" }), // FK → work_transaction.id
    name: text("name").notNull(),
    age: text("age"), // 「30代」「不明」等も入力できるよう text
    gender: text("gender"),
    occupation: text("occupation"),
    characteristic: text("characteristic"),
    memo: text("memo"),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // character_relation_transaction の複合 FK の参照先にするため（SQLite は参照先に UNIQUE が必要）
    unique("character_transaction_id_work_id_unique").on(t.id, t.workId),
    index("character_transaction_work_id_idx").on(t.workId),
  ]
);

export type CharacterTransaction = typeof characterTransaction.$inferSelect;
export type NewCharacterTransaction = typeof characterTransaction.$inferInsert;

/**
 * 登場人物関係トランザクション
 * 複合 FK により、同じ作品に属する登場人物同士でのみ関係を作成できる
 */
export const characterRelationTransaction = sqliteTable(
  "character_relation_transaction",
  {
    id: text("id").primaryKey(), // ULID
    workId: text("work_id").notNull().references(() => workTransaction.id, { onDelete: "no action" }), // FK → work_transaction.id
    characterId: text("character_id").notNull(),
    targetCharacterId: text("target_character_id").notNull(),
    relation: text("relation").notNull(),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    foreignKey({
      name: "character_relation_character_fk",
      columns: [t.characterId, t.workId],
      foreignColumns: [characterTransaction.id, characterTransaction.workId],
    }).onDelete("no action"),
    foreignKey({
      name: "character_relation_target_character_fk",
      columns: [t.targetCharacterId, t.workId],
      foreignColumns: [characterTransaction.id, characterTransaction.workId],
    }).onDelete("no action"),
    check("character_relation_not_self", sql`character_id <> target_character_id`),
    index("character_relation_transaction_work_id_idx").on(t.workId),
  ]
);

export type CharacterRelationTransaction = typeof characterRelationTransaction.$inferSelect;
export type NewCharacterRelationTransaction = typeof characterRelationTransaction.$inferInsert;

/**
 * 気になるワードトランザクション
 */
export const wordTransaction = sqliteTable(
  "word_transaction",
  {
    id: text("id").primaryKey(), // ULID
    workId: text("work_id").notNull().references(() => workTransaction.id, { onDelete: "no action" }), // FK → work_transaction.id
    word: text("word").notNull(),
    memo: text("memo"),
    page: integer("page"),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("word_transaction_work_id_idx").on(t.workId),
  ]
);

export type WordTransaction = typeof wordTransaction.$inferSelect;
export type NewWordTransaction = typeof wordTransaction.$inferInsert;

/**
 * 出来事トランザクション
 */
export const eventTransaction = sqliteTable(
  "event_transaction",
  {
    id: text("id").primaryKey(), // ULID
    workId: text("work_id").notNull().references(() => workTransaction.id, { onDelete: "no action" }), // FK → work_transaction.id
    occurredTiming: text("occurred_timing"), // 物語中の時点（「3日目の夜」「第2章」等）のため text
    content: text("content").notNull(),
    sortOrder: integer("sort_order").notNull(), // occurred_timing は自由記述で並べ替えに使えないため、時系列順を別に持つ
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("event_transaction_work_id_idx").on(t.workId),
  ]
);

export type EventTransaction = typeof eventTransaction.$inferSelect;
export type NewEventTransaction = typeof eventTransaction.$inferInsert;

/**
 * 著者トランザクション
 */
export const authorTransaction = sqliteTable(
  "author_transaction",
  {
    id: text("id").primaryKey(), // ULID
    bookId: text("book_id").notNull().references(() => bookTransaction.id, { onDelete: "no action" }), // FK → book_transaction.id
    name: text("name").notNull(),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("author_transaction_book_id_idx").on(t.bookId),
  ]
);

export type AuthorTransaction = typeof authorTransaction.$inferSelect;
export type NewAuthorTransaction = typeof authorTransaction.$inferInsert;

/**
 * タグマスタ
 */
export const tagMaster = sqliteTable(
  "tag_master",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "no action" }), // FK → user_master.id
    name: text("name").notNull(),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    // 論理削除済みの行は除外し、削除後に同名タグを再作成できるようにする
    uniqueIndex("tag_master_user_id_name_unique").on(t.userId, t.name).where(sql`delete_flg = 0`),
    // book_tag_transaction の複合 FK の参照先にするため（SQLite は参照先に UNIQUE が必要）
    unique("tag_master_id_user_id_unique").on(t.id, t.userId),
    index("tag_master_user_id_idx").on(t.userId),
  ]
);

export type TagMaster = typeof tagMaster.$inferSelect;
export type NewTagMaster = typeof tagMaster.$inferInsert;

/**
 * 書籍タグトランザクション
 * user_id を共有する2本の複合 FK により、同じユーザーの書籍とタグ同士でのみ紐づけできる
 */
export const bookTagTransaction = sqliteTable(
  "book_tag_transaction",
  {
    id: text("id").primaryKey(), // ULID
    userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "no action" }), // FK → user_master.id
    bookId: text("book_id").notNull(),
    tagId: text("tag_id").notNull(),
    deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    foreignKey({
      name: "book_tag_book_fk",
      columns: [t.bookId, t.userId],
      foreignColumns: [bookTransaction.id, bookTransaction.userId],
    }).onDelete("no action"),
    foreignKey({
      name: "book_tag_tag_fk",
      columns: [t.tagId, t.userId],
      foreignColumns: [tagMaster.id, tagMaster.userId],
    }).onDelete("no action"),
    // 論理削除済みの行は除外し、タグを外した後に再付与できるようにする
    uniqueIndex("book_tag_transaction_book_id_tag_id_unique").on(t.bookId, t.tagId).where(sql`delete_flg = 0`),
    index("book_tag_transaction_book_id_idx").on(t.bookId),
    index("book_tag_transaction_tag_id_idx").on(t.tagId),
  ]
);

export type BookTagTransaction = typeof bookTagTransaction.$inferSelect;
export type NewBookTagTransaction = typeof bookTagTransaction.$inferInsert;
