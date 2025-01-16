import { db } from "@/server/db/db";

export async function getThesisTypes() {
  const result = await db.query.thesisTypesTable.findMany({
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
