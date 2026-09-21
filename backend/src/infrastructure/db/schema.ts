import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
export const userMaster = sqliteTable("user_master", {
  id: text("id").primaryKey(), // ULID
  name: text("name").notNull().unique(),
  birthday: text("birthday").notNull(),
  lastLoginDate: text("last_login_date"),
  darkMode: integer("dark_mode", { mode: "boolean" }).notNull().default(false),
  deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type UserMaster = typeof userMaster.$inferSelect;
export type NewUserMaster = typeof userMaster.$inferInsert;

/**
 * ユーザーログインマスタ
 */
export const userLoginMaster = sqliteTable("user_login_master", {
  id: text("id").primaryKey(), // ULID（ログインレコード自身のID）
  userId: text("user_id").notNull().references(() => userMaster.id, { onDelete: "cascade" }), // FK → user_master.id
  loginId: text("login_id").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  authProvider: text("auth_provider").notNull().default("password"),
  googleId: text("google_id"),
  deleteFlg: integer("delete_flg", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type UserLoginMaster = typeof userLoginMaster.$inferSelect;
export type NewUserLoginMaster = typeof userLoginMaster.$inferInsert;
