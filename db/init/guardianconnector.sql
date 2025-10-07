-- Guardian Connector Database Initialization
-- This file initializes the guardianconnector database with view config and annotated collections tables

--
-- Name: view_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.view_config (
    table_name text NOT NULL,
    views_config text NOT NULL
);

--
-- Name: view_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.view_config
    ADD CONSTRAINT view_config_pkey PRIMARY KEY (table_name);

--
-- Annotated Collections Tables
--

--
-- Name: annotated_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.annotated_collections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    collection_type text NOT NULL,
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.incidents (
    collection_id uuid NOT NULL,
    incident_type text,
    responsible_party text,
    status text DEFAULT 'suspected'::text,
    is_active boolean DEFAULT true,
    impact_description text,
    supporting_evidence jsonb
);

--
-- Name: collection_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.collection_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    collection_id uuid NOT NULL,
    source_table text NOT NULL,
    source_id text NOT NULL,
    source_data jsonb,
    added_by text NOT NULL,
    added_at timestamp with time zone DEFAULT now(),
    notes text
);

--
-- Primary Key Constraints
--

--
-- Name: annotated_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annotated_collections
    ADD CONSTRAINT annotated_collections_pkey PRIMARY KEY (id);

--
-- Name: incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (collection_id);

--
-- Name: collection_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_pkey PRIMARY KEY (id);

--
-- Unique Constraints
--

--
-- Name: collection_entries_collection_id_source_table_source_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_collection_id_source_table_source_id_key UNIQUE (collection_id, source_table, source_id);

--
-- Foreign Key Constraints
--

--
-- Name: incidents_collection_id_fkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.annotated_collections(id) ON DELETE CASCADE;

--
-- Name: collection_entries_collection_id_fkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_entries
    ADD CONSTRAINT collection_entries_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.annotated_collections(id) ON DELETE CASCADE;

--
-- Triggers
--

--
-- Name: update_updated_at_column; Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

--
-- Name: update_annotated_collections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

DROP TRIGGER IF EXISTS update_annotated_collections_updated_at ON public.annotated_collections;
CREATE TRIGGER update_annotated_collections_updated_at
    BEFORE UPDATE ON public.annotated_collections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
