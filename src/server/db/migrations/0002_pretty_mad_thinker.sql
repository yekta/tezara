ALTER TABLE "advisors" ADD CONSTRAINT "advisors_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "institutes" ADD CONSTRAINT "institutes_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "universities" ADD CONSTRAINT "universities_name_unique" UNIQUE("name");