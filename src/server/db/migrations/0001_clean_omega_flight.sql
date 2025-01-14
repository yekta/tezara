CREATE TABLE IF NOT EXISTS "subjects" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thesis_subjects" (
	"thesis_id" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects" ADD CONSTRAINT "thesis_subjects_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects" ADD CONSTRAINT "thesis_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_name_idx" ON "subjects" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_created_at_idx" ON "subjects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_updated_at_idx" ON "subjects" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_deleted_at_idx" ON "subjects" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_thesis_id_idx" ON "thesis_subjects" USING btree ("thesis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_subject_id_idx" ON "thesis_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_created_at_idx" ON "thesis_subjects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_updated_at_idx" ON "thesis_subjects" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_deleted_at_idx" ON "thesis_subjects" USING btree ("deleted_at");