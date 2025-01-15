import { db } from "@/server/db/db";

export async function getUniversities() {
  const result = await db.query.universitiesTable.findMany({
    columns: {
      id: true,
      name: true,
    },
    orderBy(fields, operators) {
      return operators.asc(fields.name);
    },
  });
  return result;
}
