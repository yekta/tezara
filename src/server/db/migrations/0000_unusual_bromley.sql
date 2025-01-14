CREATE TABLE IF NOT EXISTS "advisors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authors" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branches" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "institutes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "languages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "theses" (
	"id" integer PRIMARY KEY NOT NULL,
	"author_id" uuid NOT NULL,
	"language_id" uuid NOT NULL,
	"title_turkish" varchar,
	"title_foreign" varchar,
	"abstract_turkish" varchar,
	"abstract_foreign" varchar,
	"year" integer NOT NULL,
	"university_id" uuid NOT NULL,
	"institute_id" uuid NOT NULL,
	"department_id" uuid,
	"branch_id" uuid,
	"type" varchar NOT NULL,
	"detail_id_1" varchar NOT NULL,
	"detail_id_2" varchar NOT NULL,
	"page_count" integer NOT NULL,
	"pdf_url" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thesis_advisors" (
	"thesis_id" integer NOT NULL,
	"advisor_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "universities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_institute_id_institutes_id_fk" FOREIGN KEY ("institute_id") REFERENCES "public"."institutes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "theses" ADD CONSTRAINT "theses_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_advisors" ADD CONSTRAINT "thesis_advisors_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thesis_advisors" ADD CONSTRAINT "thesis_advisors_advisor_id_advisors_id_fk" FOREIGN KEY ("advisor_id") REFERENCES "public"."advisors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisors_name_idx" ON "advisors" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisors_created_at_idx" ON "advisors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisors_updated_at_idx" ON "advisors" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "advisors_deleted_at_idx" ON "advisors" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "authors_name_idx" ON "authors" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "authors_created_at_idx" ON "authors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "authors_updated_at_idx" ON "authors" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "authors_deleted_at_idx" ON "authors" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_name_idx" ON "branches" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_created_at_idx" ON "branches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_updated_at_idx" ON "branches" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_deleted_at_idx" ON "branches" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_created_at_idx" ON "departments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_updated_at_idx" ON "departments" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "departments_deleted_at_idx" ON "departments" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "institutes_name_idx" ON "institutes" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "institutes_created_at_idx" ON "institutes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "institutes_updated_at_idx" ON "institutes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "institutes_deleted_at_idx" ON "institutes" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "languages_name_idx" ON "languages" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "languages_created_at_idx" ON "languages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "languages_updated_at_idx" ON "languages" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "languages_deleted_at_idx" ON "languages" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_author_id_idx" ON "theses" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_language_id_idx" ON "theses" USING btree ("language_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_title_turkish_fts_idx" ON "theses" USING gin (to_tsvector('simple', "title_turkish"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_title_foreign_fts_idx" ON "theses" USING gin (to_tsvector('simple', "title_foreign"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_abstract_turkish_fts_idx" ON "theses" USING gin (to_tsvector('simple', "abstract_turkish"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_abstract_foreign_fts_idx" ON "theses" USING gin (to_tsvector('simple', "abstract_foreign"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_year_idx" ON "theses" USING btree ("year");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_university_id_idx" ON "theses" USING btree ("university_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_institute_id_idx" ON "theses" USING btree ("institute_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_department_id_idx" ON "theses" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_branch_id_idx" ON "theses" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_type_idx" ON "theses" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_created_at_idx" ON "theses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_updated_at_idx" ON "theses" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "theses_deleted_at_idx" ON "theses" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_advisors_thesis_id_idx" ON "thesis_advisors" USING btree ("thesis_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_advisors_advisor_id_idx" ON "thesis_advisors" USING btree ("advisor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_advisors_created_at_idx" ON "thesis_advisors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_advisors_updated_at_idx" ON "thesis_advisors" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "thesis_advisors_deleted_at_idx" ON "thesis_advisors" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "universities_name_idx" ON "universities" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "universities_created_at_idx" ON "universities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "universities_updated_at_idx" ON "universities" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "universities_deleted_at_idx" ON "universities" USING btree ("deleted_at");