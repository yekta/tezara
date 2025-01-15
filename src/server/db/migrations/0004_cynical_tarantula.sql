ALTER TABLE "theses" ADD COLUMN "thesis_type_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_thesis_type_id_thesis_types_id_fk" FOREIGN KEY ("thesis_type_id") REFERENCES "public"."thesis_types"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_thesis_type_id_idx" ON "theses" USING btree ("thesis_type_id");