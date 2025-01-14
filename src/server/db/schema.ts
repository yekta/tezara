import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
};

export const authorsTable = pgTable(
  "authors",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("authors_name_idx").on(table.name),
    createdAtIdx: index("authors_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("authors_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("authors_deleted_at_idx").on(table.deletedAt),
  })
);

export const advisorsTable = pgTable(
  "advisors",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("advisors_name_idx").on(table.name),
    createdAtIdx: index("advisors_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("advisors_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("advisors_deleted_at_idx").on(table.deletedAt),
  })
);

export const universitiesTable = pgTable(
  "universities",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("universities_name_idx").on(table.name),
    createdAtIdx: index("universities_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("universities_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("universities_deleted_at_idx").on(table.deletedAt),
  })
);

export const departmentsTable = pgTable(
  "departments",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("departments_name_idx").on(table.name),
    createdAtIdx: index("departments_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("departments_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("departments_deleted_at_idx").on(table.deletedAt),
  })
);

export const institutesTable = pgTable(
  "institutes",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("institutes_name_idx").on(table.name),
    createdAtIdx: index("institutes_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("institutes_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("institutes_deleted_at_idx").on(table.deletedAt),
  })
);

export const branchesTable = pgTable(
  "branches",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("branches_name_idx").on(table.name),
    createdAtIdx: index("branches_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("branches_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("branches_deleted_at_idx").on(table.deletedAt),
  })
);

export const subjectsTable = pgTable(
  "subjects",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("subjects_name_idx").on(table.name),
    createdAtIdx: index("subjects_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("subjects_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("subjects_deleted_at_idx").on(table.deletedAt),
  })
);

export const languagesTable = pgTable(
  "languages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("languages_name_idx").on(table.name),
    createdAtIdx: index("languages_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("languages_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("languages_deleted_at_idx").on(table.deletedAt),
  })
);

export const thesesTable = pgTable(
  "theses",
  {
    id: integer("id").primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authorsTable.id),
    languageId: uuid("language_id")
      .notNull()
      .references(() => languagesTable.id),
    titleTurkish: varchar("title_turkish"),
    titleForeign: varchar("title_foreign"),
    abstractTurkish: varchar("abstract_turkish"),
    abstractForeign: varchar("abstract_foreign"),
    year: integer("year").notNull(),
    universityId: uuid("university_id")
      .notNull()
      .references(() => universitiesTable.id),
    instituteId: uuid("institute_id")
      .notNull()
      .references(() => institutesTable.id),
    departmentId: uuid("department_id").references(() => departmentsTable.id),
    branchId: uuid("branch_id").references(() => branchesTable.id),
    type: varchar("type").notNull(),
    detailId1: varchar("detail_id_1").notNull(),
    detailId2: varchar("detail_id_2").notNull(),
    pageCount: integer("page_count").notNull(),
    pdfUrl: varchar("pdf_url"),
    ...timestamps,
  },
  (table) => ({
    authorIdIdx: index("theses_author_id_idx").on(table.authorId),
    languageIdIdx: index("theses_language_id_idx").on(table.languageId),
    titleTurkishFtsIdx: index("theses_title_turkish_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.titleTurkish})`
    ),
    titleForeignFtsIdx: index("theses_title_foreign_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.titleForeign})`
    ),
    abstractTurkishFtsIdx: index("theses_abstract_turkish_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.abstractTurkish})`
    ),
    abstractForeignFtsIdx: index("theses_abstract_foreign_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.abstractForeign})`
    ),
    yearIdx: index("theses_year_idx").on(table.year),
    universityIdIdx: index("theses_university_id_idx").on(table.universityId),
    instituteIdIdx: index("theses_institute_id_idx").on(table.instituteId),
    departmentIdIdx: index("theses_department_id_idx").on(table.departmentId),
    branchIdIdx: index("theses_branch_id_idx").on(table.branchId),
    typeIdx: index("theses_type_idx").on(table.type),
    createdAtIdx: index("theses_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("theses_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("theses_deleted_at_idx").on(table.deletedAt),
  })
);

export const thesisAdvisorsTable = pgTable(
  "thesis_advisors",
  {
    thesisId: integer("thesis_id")
      .notNull()
      .references(() => thesesTable.id),
    advisorId: uuid("advisor_id")
      .notNull()
      .references(() => advisorsTable.id),
    ...timestamps,
  },
  (table) => ({
    thesisIdIdx: index("thesis_advisors_thesis_id_idx").on(table.thesisId),
    advisorIdIdx: index("thesis_advisors_advisor_id_idx").on(table.advisorId),
    createdAtIdx: index("thesis_advisors_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("thesis_advisors_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("thesis_advisors_deleted_at_idx").on(table.deletedAt),
  })
);

export const thesisSubjectsTable = pgTable(
  "thesis_subjects",
  {
    thesisId: integer("thesis_id")
      .notNull()
      .references(() => thesesTable.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectsTable.id),
    ...timestamps,
  },
  (table) => ({
    thesisIdIdx: index("thesis_subjects_thesis_id_idx").on(table.thesisId),
    subjectIdIdx: index("thesis_subjects_subject_id_idx").on(table.subjectId),
    createdAtIdx: index("thesis_subjects_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("thesis_subjects_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("thesis_subjects_deleted_at_idx").on(table.deletedAt),
  })
);
