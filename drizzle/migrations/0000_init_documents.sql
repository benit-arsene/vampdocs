CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text DEFAULT 'Untitled document' NOT NULL,
	"content" jsonb DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION documents_set_updated_at() RETURNS trigger AS $$
BEGIN
	-- The client always sends the whole document, so the server owns the
	-- timestamp. Overwriting unconditionally keeps a stale or absent
	-- `updated_at` in the payload from pinning the row's position in the
	-- recent-documents list to an old date.
	NEW.updated_at := now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "documents_set_updated_at" ON "documents";
--> statement-breakpoint
CREATE TRIGGER "documents_set_updated_at"
	BEFORE UPDATE ON "documents"
	FOR EACH ROW
	EXECUTE FUNCTION documents_set_updated_at();