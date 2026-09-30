import DocumentApp from "./components/DocumentApp";

/*
  The root route opens a fresh, blank document.

  It is deliberately a Server Component with no `initialDocument`: the editor
  starts empty, `documentId` stays null, and no database row is created merely
  by opening the app. The first row appears only when the user types or saves,
  which the autosave handles.

  Opening a saved document is the `/[slug]` route, which looks the row up and
  hands it to the same component.
*/
export default function Home() {
  return <DocumentApp />;
}
