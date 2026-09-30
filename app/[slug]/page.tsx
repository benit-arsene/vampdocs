import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import DocumentApp from "../components/DocumentApp";
import { db } from "@/db";
import { documents } from "@/drizzle/schema";

/*
  Open a saved document by its slug.

  This is a Server Component, so the row is read straight from Neon with
  Drizzle — no GET route and no client-side fetch. A slug that matches nothing
  is a genuine 404 rather than a redirect or a blank editor.

  `slug` is declared `.unique()` in the schema, so this lookup is an index seek.
*/
export default async function DocumentPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;

  const row = await db.query.documents.findFirst({
    where: eq(documents.slug, slug),
  });

  if (!row) notFound();

  return (
    <DocumentApp
      initialDocument={{
        id: row.id,
        title: row.title,
        content: row.content,
        slug: row.slug,
      }}
    />
  );
}
