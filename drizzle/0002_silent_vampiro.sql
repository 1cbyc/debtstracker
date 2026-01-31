ALTER TABLE "debt" ALTER COLUMN "total_amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "debt" ALTER COLUMN "current_balance" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "goal" ALTER COLUMN "target_amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "goal" ALTER COLUMN "current_amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "debt" ADD COLUMN "interest_rate" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "debt" ADD COLUMN "minimum_payment" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "debt" ADD COLUMN "next_payment_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "currency" varchar(3) NOT NULL;