import {
  pgTable,
  text,
  uuid,
  timestamp,
  boolean,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

// Annotated Collections Tables (new tables)
export const annotatedCollections = pgTable("annotated_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  collectionType: text("collection_type").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  metadata: jsonb("metadata").default({}),
});

export const incidents = pgTable("incidents", {
  collectionId: uuid("collection_id")
    .primaryKey()
    .references(() => annotatedCollections.id, { onDelete: "cascade" }),
  incidentType: text("incident_type"),
  responsibleParty: text("responsible_party"),
  status: text("status").default("suspected"),
  isActive: boolean("is_active").default(true),
  impactDescription: text("impact_description"),
  supportingEvidence: jsonb("supporting_evidence"),
});

export const collectionEntries = pgTable(
  "collection_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => annotatedCollections.id, { onDelete: "cascade" }),
    sourceTable: text("source_table").notNull(),
    sourceId: text("source_id").notNull(),
    sourceData: jsonb("source_data"),
    addedBy: text("added_by").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
    notes: text("notes"),
  },
  (table) => [
    unique().on(table.collectionId, table.sourceTable, table.sourceId),
  ],
);
