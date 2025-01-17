CREATE TABLE IF NOT EXISTS "keywords_english" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "keywords_english_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "keywords_turkish" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "keywords_turkish_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects_english" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "subjects_english_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects_turkish" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "subjects_turkish_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thesis_keywords_english" (
	"thesis_id" integer NOT NULL,
	"keyword_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thesis_keywords_turkish" (
	"thesis_id" integer NOT NULL,
	"keyword_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thesis_subjects_english" (
	"thesis_id" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thesis_subjects_turkish" (
	"thesis_id" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "thesis_subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;--> statement-breakpoint
DROP TABLE "thesis_subjects" CASCADE;--> statement-breakpoint
ALTER TABLE "theses" RENAME COLUMN "title_turkish" TO "title_original";--> statement-breakpoint
ALTER TABLE "theses" RENAME COLUMN "title_foreign" TO "title_translated";--> statement-breakpoint
ALTER TABLE "theses" RENAME COLUMN "abstract_turkish" TO "abstract_original";--> statement-breakpoint
ALTER TABLE "theses" RENAME COLUMN "abstract_foreign" TO "abstract_translated";--> statement-breakpoint
DROP INDEX IF EXISTS "theses_title_turkish_fts_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "theses_title_foreign_fts_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "theses_abstract_turkish_fts_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "theses_abstract_foreign_fts_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_keywords_english" ADD CONSTRAINT "thesis_keywords_english_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_keywords_english" ADD CONSTRAINT "thesis_keywords_english_keyword_id_keywords_english_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords_english"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_keywords_turkish" ADD CONSTRAINT "thesis_keywords_turkish_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_keywords_turkish" ADD CONSTRAINT "thesis_keywords_turkish_keyword_id_keywords_turkish_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords_turkish"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects_english" ADD CONSTRAINT "thesis_subjects_english_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects_english" ADD CONSTRAINT "thesis_subjects_english_subject_id_subjects_turkish_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects_turkish"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects_turkish" ADD CONSTRAINT "thesis_subjects_turkish_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_subjects_turkish" ADD CONSTRAINT "thesis_subjects_turkish_subject_id_subjects_turkish_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects_turkish"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_english_name_idx" ON "keywords_english" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_english_created_at_idx" ON "keywords_english" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_english_updated_at_idx" ON "keywords_english" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_english_deleted_at_idx" ON "keywords_english" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_turkish_name_idx" ON "keywords_turkish" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_turkish_created_at_idx" ON "keywords_turkish" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_turkish_updated_at_idx" ON "keywords_turkish" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keywords_turkish_deleted_at_idx" ON "keywords_turkish" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_english_name_idx" ON "subjects_english" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_english_created_at_idx" ON "subjects_english" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_english_updated_at_idx" ON "subjects_english" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_english_deleted_at_idx" ON "subjects_english" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_turkish_name_idx" ON "subjects_turkish" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_turkish_created_at_idx" ON "subjects_turkish" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_turkish_updated_at_idx" ON "subjects_turkish" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subjects_turkish_deleted_at_idx" ON "subjects_turkish" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_english_thesis_id_idx" ON "thesis_keywords_english" USING btree ("thesis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_english_keyword_id_idx" ON "thesis_keywords_english" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_english_created_at_idx" ON "thesis_keywords_english" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_english_updated_at_idx" ON "thesis_keywords_english" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_english_deleted_at_idx" ON "thesis_keywords_english" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_turkish_thesis_id_idx" ON "thesis_keywords_turkish" USING btree ("thesis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_turkish_keyword_id_idx" ON "thesis_keywords_turkish" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_turkish_created_at_idx" ON "thesis_keywords_turkish" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_turkish_updated_at_idx" ON "thesis_keywords_turkish" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_keywords_turkish_deleted_at_idx" ON "thesis_keywords_turkish" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_english_thesis_id_idx" ON "thesis_subjects_english" USING btree ("thesis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_english_subject_id_idx" ON "thesis_subjects_english" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_english_created_at_idx" ON "thesis_subjects_english" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_english_updated_at_idx" ON "thesis_subjects_english" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_english_deleted_at_idx" ON "thesis_subjects_english" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_turkish_thesis_id_idx" ON "thesis_subjects_turkish" USING btree ("thesis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_turkish_subject_id_idx" ON "thesis_subjects_turkish" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_turkish_created_at_idx" ON "thesis_subjects_turkish" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_turkish_updated_at_idx" ON "thesis_subjects_turkish" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_subjects_turkish_deleted_at_idx" ON "thesis_subjects_turkish" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_title_original_fts_idx" ON "theses" USING gin (to_tsvector('simple', "title_original"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_title_translated_fts_idx" ON "theses" USING gin (to_tsvector('simple', "title_translated"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_abstract_original_fts_idx" ON "theses" USING gin (to_tsvector('simple', "abstract_original"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_abstract_translated_fts_idx" ON "theses" USING gin (to_tsvector('simple', "abstract_translated"));