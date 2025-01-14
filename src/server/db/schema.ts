import {
  index,
  integer,
  pgTable,
  timestamp,
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

export const thesesTable = pgTable(
  "theses",
  {
    id: integer("id").primaryKey(),
    title: varchar("title").notNull(),
    ...timestamps,
  },
  (table) => ({
    createdAtIdx: index("theses_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("theses_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("theses_deleted_at_idx").on(table.deletedAt),
  })
);
