import { db } from "@/server/db/db";

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
