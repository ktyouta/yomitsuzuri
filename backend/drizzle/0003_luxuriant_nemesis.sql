PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_login_master` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`login_id` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`auth_provider` text DEFAULT 'password' NOT NULL,
	`google_id` text,
	`delete_flg` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user_master`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_user_login_master`("id", "user_id", "login_id", "password_hash", "salt", "auth_provider", "google_id", "delete_flg", "created_at", "updated_at") SELECT "id", "user_id", "login_id", "password_hash", "salt", "auth_provider", "google_id", "delete_flg", "created_at", "updated_at" FROM `user_login_master`;--> statement-breakpoint
DROP TABLE `user_login_master`;--> statement-breakpoint
ALTER TABLE `__new_user_login_master` RENAME TO `user_login_master`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_login_master_login_id_unique` ON `user_login_master` (`login_id`);