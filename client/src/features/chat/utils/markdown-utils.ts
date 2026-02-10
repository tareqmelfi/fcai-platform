export function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  html = html.replace(/^---$/gm, "<hr>");

  const lines = html.split("\n");
  let result = "";
  let inList = false;
  let inOl = false;
  let inCodeBlock = false;
  let codeContent = "";

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        result += `<pre><code>${codeContent}</code></pre>\n`;
        codeContent = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeContent += line + "\n";
      continue;
    }

    const ulMatch = line.match(/^[-*] (.+)$/);
    const olMatch = line.match(/^\d+\. (.+)$/);

    if (ulMatch) {
      if (!inList) { result += "<ul>\n"; inList = true; }
      result += `<li>${ulMatch[1]}</li>\n`;
    } else if (olMatch) {
      if (!inOl) { result += "<ol>\n"; inOl = true; }
      result += `<li>${olMatch[1]}</li>\n`;
    } else {
      if (inList) { result += "</ul>\n"; inList = false; }
      if (inOl) { result += "</ol>\n"; inOl = false; }
      if (line.trim() === "") {
        result += "\n";
      } else if (!line.startsWith("<h") && !line.startsWith("<blockquote") && !line.startsWith("<hr")) {
        result += `<p>${line}</p>\n`;
      } else {
        result += line + "\n";
      }
    }
  }
  if (inList) result += "</ul>\n";
  if (inOl) result += "</ol>\n";
  if (inCodeBlock) result += `<pre><code>${codeContent}</code></pre>\n`;

  return result;
}
