ALTER TABLE "thesis_types" ADD COLUMN "x_order" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_types_x_order_idx" ON "thesis_types" USING btree ("x_order");