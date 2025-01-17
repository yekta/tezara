ALTER TABLE "thesis_subjects_english" DROP CONSTRAINT "thesis_subjects_english_subject_id_subjects_turkish_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects_english" ADD CONSTRAINT "thesis_subjects_english_subject_id_subjects_english_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects_english"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
