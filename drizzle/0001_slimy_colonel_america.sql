ALTER TABLE "user" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");