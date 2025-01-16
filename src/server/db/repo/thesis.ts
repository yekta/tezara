import { TSearchThesesSchema } from "@/components/search/types";
import { db } from "@/server/db/db";
import {
  authorsTable,
  branchesTable,
  departmentsTable,
  institutesTable,
  languagesTable,
  thesesTable,
  thesisTypesTable,
  universitiesTable,
} from "@/server/db/schema";
import { and, desc, eq, ilike, or, SQL, sql } from "drizzle-orm";

const rowLimit = 200;
const bulkRowLimit = 10000;

export async function getThesis({ id }: { id: number }) {
  const result = await db.query.thesesTable.findFirst({
    columns: {
      id: true,
      titleTurkish: true,
      titleForeign: true,
      pageCount: true,
      abstractForeign: true,
      abstractTurkish: true,
      detailId1: true,
      detailId2: true,
      pdfUrl: true,
      year: true,
    },
    with: {
      author: {
        columns: {
          id: true,
          name: true,
        },
      },
      branch: {
        columns: {
          id: true,
          name: true,
        },
      },
      language: {
        columns: {
          id: true,
          name: true,
        },
      },
      university: {
        columns: {
          id: true,
          name: true,
        },
      },
      institute: {
        columns: {
          id: true,
          name: true,
        },
      },
      thesisType: {
        columns: {
          id: true,
          name: true,
        },
      },
      department: {
        columns: {
          id: true,
          name: true,
        },
      },
      thesisAdvisors: {
        columns: {},
        with: {
          advisor: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
      thesisSubjects: {
        columns: {},
        with: {
          subject: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    where: (fields, { eq }) => eq(fields.id, id),
  });
  return result;
}

export async function searchTheses(input: TSearchThesesSchema) {
  const { query, bulk, universities, languages, thesisTypes } = input;

  let queryFilters: SQL<unknown> | undefined = undefined;
  let universityFilters: SQL<unknown> | undefined = undefined;
  let languageFilters: SQL<unknown> | undefined = undefined;
  let thesisTypeFilters: SQL<unknown> | undefined = undefined;

  if (universities && universities.length) {
    universityFilters = or(
      ...universities.map((university) =>
        eq(universitiesTable.name, university)
      )
    );
  }

  if (languages && languages.length) {
    languageFilters = or(
      ...languages.map((language) => eq(languagesTable.name, language))
    );
  }

  if (thesisTypes && thesisTypes.length) {
    thesisTypeFilters = or(
      ...thesisTypes.map((thesisType) => eq(thesisTypesTable.name, thesisType))
    );
  }

  if (query) {
    queryFilters = or(
      sql`to_tsvector('turkish', ${thesesTable.titleTurkish}) @@ phraseto_tsquery('turkish', ${query})`,
      sql`to_tsvector('english', ${thesesTable.titleForeign}) @@ phraseto_tsquery('english', ${query})`,
      ilike(authorsTable.name, `%${query}%`),
      sql`"theses"."id" IN (
        SELECT ta."thesis_id"
        FROM "thesis_advisors" ta
        JOIN "advisors" adv ON ta."advisor_id" = adv."id"
        WHERE adv."name" ILIKE ${"%" + query + "%"}
      )`
    );
  }

  const result = await db
    .select({
      // === Main Thesis Columns ===
      id: thesesTable.id,
      titleTurkish: thesesTable.titleTurkish,
      titleForeign: thesesTable.titleForeign,
      pageCount: thesesTable.pageCount,
      abstractForeign: thesesTable.abstractForeign,
      abstractTurkish: thesesTable.abstractTurkish,
      detailId1: thesesTable.detailId1,
      detailId2: thesesTable.detailId2,
      pdfUrl: thesesTable.pdfUrl,
      year: thesesTable.year,

      // === Related Entities (1-to-1 or many-to-1) ===
      authorId: authorsTable.id,
      authorName: authorsTable.name,

      branchId: branchesTable.id,
      branchName: branchesTable.name,

      languageId: languagesTable.id,
      languageName: languagesTable.name,

      universityId: universitiesTable.id,
      universityName: universitiesTable.name,

      instituteId: institutesTable.id,
      instituteName: institutesTable.name,

      departmentId: departmentsTable.id,
      departmentName: departmentsTable.name,

      thesisTypeId: thesisTypesTable.id,
      thesisTypeName: thesisTypesTable.name,

      // === Advisors (JSON Aggregation) ===
      advisors: sql<{ id: string; name: string }[]>`(
        SELECT COALESCE(
          json_agg(
            json_build_object('id', adv."id", 'name', adv."name")
          ),
          '[]'::json
        )
        FROM "thesis_advisors" ta
        JOIN "advisors" adv ON ta."advisor_id" = adv."id"
        WHERE ta."thesis_id" = "theses"."id"
      )`.as("advisors"),
    })
    .from(thesesTable)

    // Join for direct relationships. (These won't cause row duplication.)
    .leftJoin(authorsTable, eq(thesesTable.authorId, authorsTable.id))
    .leftJoin(branchesTable, eq(thesesTable.branchId, branchesTable.id))
    .leftJoin(languagesTable, eq(thesesTable.languageId, languagesTable.id))
    .leftJoin(
      universitiesTable,
      eq(thesesTable.universityId, universitiesTable.id)
    )
    .leftJoin(institutesTable, eq(thesesTable.instituteId, institutesTable.id))
    .leftJoin(
      departmentsTable,
      eq(thesesTable.departmentId, departmentsTable.id)
    )
    .leftJoin(
      thesisTypesTable,
      eq(thesesTable.thesisTypeId, thesisTypesTable.id)
    )
    .where(
      and(universityFilters, languageFilters, thesisTypeFilters, queryFilters)
    )
    .orderBy(desc(thesesTable.id))
    .limit(bulk ? bulkRowLimit : rowLimit);

  return result;
}
