PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_config` (
	`id` text DEFAULT 'default',
	`provider` text,
	`api_key` text,
	`model` text
);
--> statement-breakpoint
INSERT INTO `__new_config`("id", "provider", "api_key", "model") SELECT "id", "provider", "api_key", "model" FROM `config`;--> statement-breakpoint
DROP TABLE `config`;--> statement-breakpoint
ALTER TABLE `__new_config` RENAME TO `config`;--> statement-breakpoint
PRAGMA foreign_keys=ON;