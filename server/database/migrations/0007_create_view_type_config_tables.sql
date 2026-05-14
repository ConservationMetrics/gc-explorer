CREATE TABLE IF NOT EXISTS "view_config_alerts" (
  "view_id" text PRIMARY KEY NOT NULL,
  "primary_dataset" text NOT NULL,
  "secondary_dataset" text,
  CONSTRAINT "view_config_alerts_view_id_fk"
    FOREIGN KEY ("view_id")
    REFERENCES "view_config" ("table_name")
    ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "view_config_map" (
  "view_id" text PRIMARY KEY NOT NULL,
  "primary_dataset" text NOT NULL,
  "secondary_datasets" text,
  CONSTRAINT "view_config_map_view_id_fk"
    FOREIGN KEY ("view_id")
    REFERENCES "view_config" ("table_name")
    ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "view_config_gallery" (
  "view_id" text PRIMARY KEY NOT NULL,
  "primary_dataset" text NOT NULL,
  CONSTRAINT "view_config_gallery_view_id_fk"
    FOREIGN KEY ("view_id")
    REFERENCES "view_config" ("table_name")
    ON DELETE CASCADE
);
