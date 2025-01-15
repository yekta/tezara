CREATE TABLE IF NOT EXISTS "thesis_types" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "thesis_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_types_name_idx" ON "thesis_types" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_types_created_at_idx" ON "thesis_types" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_types_updated_at_idx" ON "thesis_types" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_types_deleted_at_idx" ON "thesis_types" USING btree ("deleted_at");