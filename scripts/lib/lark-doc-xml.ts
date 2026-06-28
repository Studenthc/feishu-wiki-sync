export function markdownToLarkXml(title: string, markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [`<title>${escapeXml(title)}</title>`];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    if (line === "---") {
      blocks.push("<hr/>");
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${formatInline(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push(`<blockquote><p>${formatInline(line.slice(2))}</p></blockquote>`);
      continue;
    }

    if (/^- /.test(line)) {
      const items = collectListItems(lines, i, /^- /, (value) => value.slice(2));
      blocks.push(`<ul>${items.values.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>`);
      i = items.nextIndex - 1;
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items = collectListItems(lines, i, /^\d+\. /, (value) =>
        value.replace(/^\d+\. /, "")
      );
      blocks.push(
        `<ol>${items.values
          .map((item) => `<li seq="auto">${formatInline(item)}</li>`)
          .join("")}</ol>`
      );
      i = items.nextIndex - 1;
      continue;
    }

    blocks.push(`<p>${formatInline(line)}</p>`);
  }

  return blocks.join("");
}

export function sanitizeLarkMarkdown(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .filter((line) => !line.includes("**封面**: ![]("))
    .map((line) => line.replace(/\[访问产品\]\(null\)/g, "未提供"))
    .join("\n");
}

function collectListItems(
  lines: string[],
  startIndex: number,
  pattern: RegExp,
  trimMarker: (line: string) => string
): { values: string[]; nextIndex: number } {
  const values: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!pattern.test(line)) {
      break;
    }
    values.push(trimMarker(line));
    index += 1;
  }

  return { values, nextIndex: index };
}

function formatInline(value: string): string {
  const placeholders: string[] = [];
  let text = value.replace(/!\[\]\(([^)]+)\)/g, (_match, href: string) => {
    if (!isUsableUrl(href)) {
      return "";
    }
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(`<img href="${escapeAttribute(href)}"/>`);
    return token;
  });

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, href: string) => {
    if (!isUsableUrl(href)) {
      return escapeXml(label);
    }
    const token = `\u0000${placeholders.length}\u0000`;
    placeholders.push(`<a href="${escapeAttribute(href)}">${escapeXml(label)}</a>`);
    return token;
  });

  text = escapeXml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

  placeholders.forEach((placeholder, index) => {
    text = text.replace(new RegExp(`\\u0000${index}\\u0000`, "g"), placeholder);
  });

  return text;
}

function isUsableUrl(value: string): boolean {
  return value !== "null" && /^https?:\/\//.test(value);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeXml(value).replace(/"/g, "&quot;");
}
