CREATE TABLE `config` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`provider` text,
	`api_key` text,
	`model` text
);
