"use client";

import { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink } from "docx";

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
export function downloadFile(name: string, contents: string | Blob, type: string): void {
  const blob = contents instanceof Blob ? contents : new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
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

/** Convert TipTap JSON content to docx paragraphs. */
function tipTapToDocxNodes(content: any[]): any[] {
  const nodes: any[] = [];
  
  function processNode(node: any): any[] {
    const results: any[] = [];
    
    switch (node.type) {
      case "paragraph": {
        const children = node.content ? node.content.flatMap(processNode) : [new TextRun({ text: "" })];
        results.push(new Paragraph({ children }));
        break;
      }
      case "heading": {
        const level = node.attrs?.level || 1;
        const children = node.content ? node.content.flatMap(processNode) : [new TextRun({ text: "" })];
        const headingLevel = level === 1 ? HeadingLevel.HEADING_1 :
                           level === 2 ? HeadingLevel.HEADING_2 :
                           level === 3 ? HeadingLevel.HEADING_3 :
                           level === 4 ? HeadingLevel.HEADING_4 :
                           level === 5 ? HeadingLevel.HEADING_5 :
                           HeadingLevel.HEADING_6;
        results.push(new Paragraph({ children, heading: headingLevel }));
        break;
      }
      case "text": {
        const marks = node.marks || [];
        const textRun = new TextRun({
          text: node.text || "",
          bold: marks.some((m: any) => m.type === "bold"),
          italics: marks.some((m: any) => m.type === "italic"),
          underline: marks.some((m: any) => m.type === "underline") ? {} : undefined,
          strike: marks.some((m: any) => m.type === "strike"),
          font: marks.some((m: any) => m.type === "code") ? "Courier New" : undefined,
          size: marks.some((m: any) => m.type === "code") ? 22 : undefined, // 11pt = 22 half-points
        });
        results.push(textRun);
        break;
      }
      case "hardBreak": {
        results.push(new TextRun({ text: "", break: 1 }));
        break;
      }
      case "bulletList": {
        const items = node.content?.map((item: any) => {
          const children = item.content?.flatMap(processNode) || [new TextRun({ text: "" })];
          return new Paragraph({ children, bullet: { level: 0 } });
        }) || [];
        results.push(...items);
        break;
      }
      case "orderedList": {
        const items = node.content?.map((item: any) => {
          const children = item.content?.flatMap(processNode) || [new TextRun({ text: "" })];
          return new Paragraph({ children, numbering: { reference: "ordered", level: 0 } });
        }) || [];
        results.push(...items);
        break;
      }
      case "listItem": {
        const children = node.content?.flatMap(processNode) || [new TextRun({ text: "" })];
        results.push(new Paragraph({ children }));
        break;
      }
      case "blockquote": {
        const children = node.content?.flatMap(processNode) || [new TextRun({ text: "" })];
        results.push(new Paragraph({ children, indent: { left: 720 } })); // 0.5 inch
        break;
      }
      case "horizontalRule": {
        results.push(new Paragraph({ children: [new TextRun({ text: "─".repeat(40) })] }));
        break;
      }
      case "codeBlock": {
        const text = node.content?.map((c: any) => c.text).join("\n") || "";
        results.push(new Paragraph({
          children: [new TextRun({ text, font: "Courier New", size: 20 })],
          shading: { fill: "f2f2f2" },
        }));
        break;
      }
      default: {
        // For unknown nodes, process children
        if (node.content) {
          results.push(...node.content.flatMap(processNode));
        }
        break;
      }
    }
    
    return results;
  }
  
  return content.flatMap(processNode);
}

/** Export the current editor content as a DOCX file download. */
export function exportAsDocx(
  editor: { getJSON: () => any } | null,
  docTitle: string
): void {
  if (!editor) return;
  
  try {
    const jsonContent = editor.getJSON();
    const content = jsonContent?.content || [];
    const docxNodes = tipTapToDocxNodes(content);
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: docxNodes.length > 0 ? docxNodes : [new Paragraph({ children: [new TextRun({ text: "" })] })],
      }],
    });
    
    Packer.toBlob(doc).then((blob) => {
      const sanitizedTitle = sanitizeFilename(docTitle || "");
      const filename = sanitizedTitle ? `${sanitizedTitle}.docx` : "Untitled document.docx";
      downloadFile(filename, blob, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    });
  } catch (error) {
    console.error("DOCX export failed:", error);
    window.alert("Failed to export as DOCX. See console for details.");
  }
}