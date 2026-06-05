CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`cwd` text NOT NULL,
	`model` text NOT NULL,
	`mode` text NOT NULL,
	`messages` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `config` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`provider` text,
	`api_key` text,
	`model` text
);
