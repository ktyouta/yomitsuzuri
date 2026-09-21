CREATE TABLE `user_login_master` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`login_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`auth_provider` text DEFAULT 'password' NOT NULL,
	`google_id` text,
	`delete_flg` text DEFAULT '0' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_login_master_login_id_unique` ON `user_login_master` (`login_id`);--> statement-breakpoint
CREATE TABLE `user_master` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`birthday` text NOT NULL,
	`last_login_date` text,
	`delete_flg` text DEFAULT '0' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_master_name_unique` ON `user_master` (`name`);
