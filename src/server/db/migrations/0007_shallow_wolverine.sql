ALTER TABLE "languages" ADD COLUMN "x_order" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "languages_x_order_idx" ON "languages" USING btree ("x_order");