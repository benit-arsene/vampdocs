import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import DocumentApp from "../components/DocumentApp";
import { db } from "@/db";
import { documents } from "@/drizzle/schema";

/*
  The canonical form of a UUID, as PostgreSQL stores and returns it.

  `documents.id` is a `uuid` column, so handing Postgres a non-UUID string
  (from any URL under this route) would raise `invalid input syntax for type
  uuid` rather than simply matching nothing. Checking the shape first turns
  every such URL into an ordinary 404.
*/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
  Open a saved document by its UUID.

  This is a Server Component, so the row is read straight from Neon with
  Drizzle — no GET route and no client-side fetch. An id that is not a UUID, or
  is a UUID no document uses, is a genuine 404 rather than a redirect or a
  blank editor.

  `id` is the primary key, so this lookup is an index seek.
*/
export default async function DocumentPage(props: PageProps<"/[id]">) {
  const { id } = await props.params;

  if (!UUID_PATTERN.test(id)) notFound();

  const row = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });

  if (!row) notFound();

  return (
    <DocumentApp
      initialDocument={{
        id: row.id,
        title: row.title,
        content: row.content,
      }}
    />
  );
}