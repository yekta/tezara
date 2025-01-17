import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const subjectsTurkishTable = pgTable(
  "subjects_turkish",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("subjects_turkish_name_idx").on(table.name),
    createdAtIdx: index("subjects_turkish_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("subjects_turkish_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("subjects_turkish_deleted_at_idx").on(table.deletedAt),
  })
);

export const subjectsEnglishTable = pgTable(
  "subjects_english",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("subjects_english_name_idx").on(table.name),
    createdAtIdx: index("subjects_english_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("subjects_english_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("subjects_english_deleted_at_idx").on(table.deletedAt),
  })
);

export const keywordsTurkishTable = pgTable(
  "keywords_turkish",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("keywords_turkish_name_idx").on(table.name),
    createdAtIdx: index("keywords_turkish_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("keywords_turkish_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("keywords_turkish_deleted_at_idx").on(table.deletedAt),
  })
);

export const keywordsEnglishTable = pgTable(
  "keywords_english",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("keywords_english_name_idx").on(table.name),
    createdAtIdx: index("keywords_english_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("keywords_english_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("keywords_english_deleted_at_idx").on(table.deletedAt),
  })
);

export const languagesTable = pgTable(
  "languages",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    xOrder: integer("x_order"),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("languages_name_idx").on(table.name),
    xOrderIdx: index("languages_x_order_idx").on(table.xOrder),
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
    titleOriginal: varchar("title_original"),
    titleTranslated: varchar("title_translated"),
    abstractOriginal: varchar("abstract_original"),
    abstractTranslated: varchar("abstract_translated"),
    year: integer("year").notNull(),
    universityId: uuid("university_id")
      .notNull()
      .references(() => universitiesTable.id),
    instituteId: uuid("institute_id").references(() => institutesTable.id),
    departmentId: uuid("department_id").references(() => departmentsTable.id),
    branchId: uuid("branch_id").references(() => branchesTable.id),
    thesisTypeId: uuid("thesis_type_id").references(() => thesisTypesTable.id),
    detailId1: varchar("detail_id_1").notNull(),
    detailId2: varchar("detail_id_2").notNull(),
    pageCount: integer("page_count").notNull(),
    pdfUrl: varchar("pdf_url"),
    ...timestamps,
  },
  (table) => ({
    authorIdIdx: index("theses_author_id_idx").on(table.authorId),
    languageIdIdx: index("theses_language_id_idx").on(table.languageId),
    titleOriginalFtsIdx: index("theses_title_original_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.titleOriginal})`
    ),
    titleTranslatedFtsIdx: index("theses_title_translated_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.titleTranslated})`
    ),
    abstractOriginalFtsIdx: index("theses_abstract_original_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.abstractOriginal})`
    ),
    abstractTranslatedFtsIdx: index("theses_abstract_translated_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.abstractTranslated})`
    ),
    yearIdx: index("theses_year_idx").on(table.year),
    universityIdIdx: index("theses_university_id_idx").on(table.universityId),
    instituteIdIdx: index("theses_institute_id_idx").on(table.instituteId),
    departmentIdIdx: index("theses_department_id_idx").on(table.departmentId),
    branchIdIdx: index("theses_branch_id_idx").on(table.branchId),
    thesisTypeIdIdx: index("theses_thesis_type_id_idx").on(table.thesisTypeId),
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

export const thesisSubjectsTurkishTable = pgTable(
  "thesis_subjects_turkish",
  {
    thesisId: integer("thesis_id")
      .notNull()
      .references(() => thesesTable.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectsTurkishTable.id),
    ...timestamps,
  },
  (table) => ({
    thesisIdIdx: index("thesis_subjects_turkish_thesis_id_idx").on(
      table.thesisId
    ),
    subjectIdIdx: index("thesis_subjects_turkish_subject_id_idx").on(
      table.subjectId
    ),
    createdAtIdx: index("thesis_subjects_turkish_created_at_idx").on(
      table.createdAt
    ),
    updatedAtIdx: index("thesis_subjects_turkish_updated_at_idx").on(
      table.updatedAt
    ),
    deletedAtIdx: index("thesis_subjects_turkish_deleted_at_idx").on(
      table.deletedAt
    ),
  })
);

export const thesisSubjectsEnglishTable = pgTable(
  "thesis_subjects_english",
  {
    thesisId: integer("thesis_id")
      .notNull()
      .references(() => thesesTable.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjectsEnglishTable.id),
    ...timestamps,
  },
  (table) => ({
    thesisIdIdx: index("thesis_subjects_english_thesis_id_idx").on(
      table.thesisId
    ),
    subjectIdIdx: index("thesis_subjects_english_subject_id_idx").on(
      table.subjectId
    ),
    createdAtIdx: index("thesis_subjects_english_created_at_idx").on(
      table.createdAt
    ),
    updatedAtIdx: index("thesis_subjects_english_updated_at_idx").on(
      table.updatedAt
    ),
    deletedAtIdx: index("thesis_subjects_english_deleted_at_idx").on(
      table.deletedAt
    ),
  })
);

export const thesisKeywordsTurkishTable = pgTable(
  "thesis_keywords_turkish",
  {
    thesisId: integer("thesis_id")
      .notNull()
      .references(() => thesesTable.id),
    keywordId: uuid("keyword_id")
      .notNull()
      .references(() => keywordsTurkishTable.id),
    ...timestamps,
  },
  (table) => ({
    thesisIdIdx: index("thesis_keywords_turkish_thesis_id_idx").on(
      table.thesisId
    ),
    keywordIdIdx: index("thesis_keywords_turkish_keyword_id_idx").on(
      table.keywordId
    ),
    createdAtIdx: index("thesis_keywords_turkish_created_at_idx").on(
      table.createdAt
    ),
    updatedAtIdx: index("thesis_keywords_turkish_updated_at_idx").on(
      table.updatedAt
    ),
    deletedAtIdx: index("thesis_keywords_turkish_deleted_at_idx").on(
      table.deletedAt
    ),
  })
);

export const thesisKeywordsEnglishTable = pgTable(
  "thesis_keywords_english",
  {
    thesisId: integer("thesis_id")
      .notNull()
      .references(() => thesesTable.id),
    keywordId: uuid("keyword_id")
      .notNull()
      .references(() => keywordsEnglishTable.id),
    ...timestamps,
  },
  (table) => ({
    thesisIdIdx: index("thesis_keywords_english_thesis_id_idx").on(
      table.thesisId
    ),
    keywordIdIdx: index("thesis_keywords_english_keyword_id_idx").on(
      table.keywordId
    ),
    createdAtIdx: index("thesis_keywords_english_created_at_idx").on(
      table.createdAt
    ),
    updatedAtIdx: index("thesis_keywords_english_updated_at_idx").on(
      table.updatedAt
    ),
    deletedAtIdx: index("thesis_keywords_english_deleted_at_idx").on(
      table.deletedAt
    ),
  })
);

export const thesisTypesTable = pgTable(
  "thesis_types",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name").notNull().unique(),
    xOrder: integer("x_order"),
    ...timestamps,
  },
  (table) => ({
    nameIdx: index("thesis_types_name_idx").on(table.name),
    xOrderIdx: index("thesis_types_x_order_idx").on(table.xOrder),
    createdAtIdx: index("thesis_types_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("thesis_types_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("thesis_types_deleted_at_idx").on(table.deletedAt),
  })
);

////////////////////////////////////////////////////////////
//// RELATIONS /////////////////////////////////////////////
////////////////////////////////////////////////////////////

// Author relations
export const authorsRelations = relations(authorsTable, ({ many }) => ({
  theses: many(thesesTable),
}));

// Thesis Type relations
export const thesisTypesRelations = relations(thesisTypesTable, ({ many }) => ({
  theses: many(thesesTable),
}));

// Advisor relations
export const advisorsRelations = relations(advisorsTable, ({ many }) => ({
  thesisAdvisors: many(thesisAdvisorsTable),
}));

// University relations
export const universitiesRelations = relations(
  universitiesTable,
  ({ many }) => ({
    theses: many(thesesTable),
  })
);

// Department relations
export const departmentsRelations = relations(departmentsTable, ({ many }) => ({
  theses: many(thesesTable),
}));

// Institute relations
export const institutesRelations = relations(institutesTable, ({ many }) => ({
  theses: many(thesesTable),
}));

// Branch relations
export const branchesRelations = relations(branchesTable, ({ many }) => ({
  theses: many(thesesTable),
}));

// Subject relations
export const subjectsTurkishRelations = relations(
  subjectsTurkishTable,
  ({ many }) => ({
    thesisSubjects: many(thesisSubjectsTurkishTable),
  })
);
export const subjectsEnglishRelations = relations(
  subjectsEnglishTable,
  ({ many }) => ({
    thesisSubjects: many(thesisSubjectsEnglishTable),
  })
);

// Keyword relations
export const keywordsTurkishRelations = relations(
  keywordsTurkishTable,
  ({ many }) => ({
    thesisKeywords: many(thesisKeywordsTurkishTable),
  })
);
export const keywordsEnglishRelations = relations(
  keywordsEnglishTable,
  ({ many }) => ({
    thesisKeywords: many(thesisKeywordsEnglishTable),
  })
);

// Language relations
export const languagesRelations = relations(languagesTable, ({ many }) => ({
  theses: many(thesesTable),
}));

// Thesis relations
export const thesesRelations = relations(thesesTable, ({ one, many }) => ({
  author: one(authorsTable, {
    fields: [thesesTable.authorId],
    references: [authorsTable.id],
  }),
  thesisType: one(thesisTypesTable, {
    fields: [thesesTable.thesisTypeId],
    references: [thesisTypesTable.id],
  }),
  language: one(languagesTable, {
    fields: [thesesTable.languageId],
    references: [languagesTable.id],
  }),
  university: one(universitiesTable, {
    fields: [thesesTable.universityId],
    references: [universitiesTable.id],
  }),
  institute: one(institutesTable, {
    fields: [thesesTable.instituteId],
    references: [institutesTable.id],
  }),
  department: one(departmentsTable, {
    fields: [thesesTable.departmentId],
    references: [departmentsTable.id],
  }),
  branch: one(branchesTable, {
    fields: [thesesTable.branchId],
    references: [branchesTable.id],
  }),
  thesisAdvisors: many(thesisAdvisorsTable),
  thesisSubjectsTurkish: many(thesisSubjectsTurkishTable),
  thesisSubjectsEnglish: many(thesisSubjectsEnglishTable),
}));

// Thesis Advisors relations (junction table)
export const thesisAdvisorsRelations = relations(
  thesisAdvisorsTable,
  ({ one }) => ({
    thesis: one(thesesTable, {
      fields: [thesisAdvisorsTable.thesisId],
      references: [thesesTable.id],
    }),
    advisor: one(advisorsTable, {
      fields: [thesisAdvisorsTable.advisorId],
      references: [advisorsTable.id],
    }),
  })
);

// Thesis Subjects relations (junction table)
export const thesisSubjectsTurkishRelations = relations(
  thesisSubjectsTurkishTable,
  ({ one }) => ({
    thesis: one(thesesTable, {
      fields: [thesisSubjectsTurkishTable.thesisId],
      references: [thesesTable.id],
    }),
    subject: one(subjectsTurkishTable, {
      fields: [thesisSubjectsTurkishTable.subjectId],
      references: [subjectsTurkishTable.id],
    }),
  })
);
export const thesisSubjectsEnglishRelations = relations(
  thesisSubjectsEnglishTable,
  ({ one }) => ({
    thesis: one(thesesTable, {
      fields: [thesisSubjectsEnglishTable.thesisId],
      references: [thesesTable.id],
    }),
    subject: one(subjectsEnglishTable, {
      fields: [thesisSubjectsEnglishTable.subjectId],
      references: [subjectsEnglishTable.id],
    }),
  })
);

// Thesis Keywords relations (junction table)
export const thesisKeywordsTurkishRelations = relations(
  thesisKeywordsTurkishTable,
  ({ one }) => ({
    thesis: one(thesesTable, {
      fields: [thesisKeywordsTurkishTable.thesisId],
      references: [thesesTable.id],
    }),
    keyword: one(keywordsTurkishTable, {
      fields: [thesisKeywordsTurkishTable.keywordId],
      references: [keywordsTurkishTable.id],
    }),
  })
);
export const thesisKeywordsEnglishRelations = relations(
  thesisKeywordsEnglishTable,
  ({ one }) => ({
    thesis: one(thesesTable, {
      fields: [thesisKeywordsEnglishTable.thesisId],
      references: [thesesTable.id],
    }),
    keyword: one(keywordsEnglishTable, {
      fields: [thesisKeywordsEnglishTable.keywordId],
      references: [keywordsEnglishTable.id],
    }),
  })
);
