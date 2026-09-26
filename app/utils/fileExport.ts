"use client";

const DEFAULT_TITLE = "Untitled document";

/** Sanitize a filename for Windows filesystem. */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\\/:*?"<>|]/g, "") // Remove Windows-invalid characters
    .replace(/^\.+/, "") // Remove leading dots
    .trim();
}

/** Generate a full HTML document from editor HTML content. */
export function generateDocumentHtml(editorHtml: string, title: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt;
             line-height: 1.7; max-width: 160mm; margin: 25mm auto; }
    </style>
  </head>
  <body>${editorHtml}</body>
</html>`;
}

/** Trigger a browser download for the given content. */
export function downloadFile(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Export the current editor content as an HTML file download. */
export function exportAsHtml(
  editor: { getHTML: () => string } | null,
  docTitle: string
): void {
  if (!editor) return;
  
  const editorHtml = editor.getHTML();
  const fullHtml = generateDocumentHtml(editorHtml, docTitle || DEFAULT_TITLE);
  const sanitizedTitle = sanitizeFilename(docTitle || "");
  const filename = sanitizedTitle ? `${sanitizedTitle}.html` : "Untitled document.html";
  downloadFile(filename, fullHtml, "text/html");
}