import { TSearchThesesSchema } from "@/components/search/types";
import { db } from "@/server/db/db";
import { sql } from "drizzle-orm";

const rowLimit = 50;

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
      type: true,
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
  const { query } = input;

  const result = await db.query.thesesTable.findMany({
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
      type: true,
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
    where(fields, { or }) {
      const filters = or(
        sql`to_tsvector('turkish', ${fields.titleTurkish}) @@ phraseto_tsquery('turkish', ${query})`,
        sql`to_tsvector('english', ${fields.titleForeign}) @@ phraseto_tsquery('english', ${query})`
      );
      return filters;
    },
    limit: rowLimit,
  });
  return result;
}
