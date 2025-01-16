import { db } from "@/server/db/db";

export async function getLanguages() {
  const result = await db.query.languagesTable.findMany({
    columns: {
      id: true,
      name: true,
    },
    orderBy(fields, operators) {
      return [operators.asc(fields.xOrder), operators.asc(fields.name)];
    },
  });
  return result;
}
