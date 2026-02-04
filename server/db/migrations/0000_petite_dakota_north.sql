CREATE TABLE "annotated_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"collection_type" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "collection_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"source_table" text NOT NULL,
	"source_id" text NOT NULL,
	"source_data" jsonb,
	"added_by" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	CONSTRAINT "collection_entries_collection_id_source_table_source_id_unique" UNIQUE("collection_id","source_table","source_id")
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"collection_id" uuid PRIMARY KEY NOT NULL,
	"incident_type" text,
	"responsible_party" text,
	"status" text DEFAULT 'suspected',
	"is_active" boolean DEFAULT true,
	"impact_description" text,
	"supporting_evidence" jsonb
);
--> statement-breakpoint
ALTER TABLE "collection_entries" ADD CONSTRAINT "collection_entries_collection_id_annotated_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."annotated_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_collection_id_annotated_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."annotated_collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;--> statement-breakpoint
CREATE TRIGGER update_annotated_collections_updated_at
    BEFORE UPDATE ON public.annotated_collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();