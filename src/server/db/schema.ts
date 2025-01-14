import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";

const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
};

export const dashboardsTable = pgTable(
  "theses",
  {
    id: uuid("id").primaryKey(),
    title: varchar("title").notNull(),
    ...timestamps,
  },
  (table) => ({
    createdAtIdx: index("dashboards_created_at_idx").on(table.createdAt),
    updatedAtIdx: index("dashboards_updated_at_idx").on(table.updatedAt),
    deletedAtIdx: index("dashboards_deleted_at_idx").on(table.deletedAt),
  })
);
