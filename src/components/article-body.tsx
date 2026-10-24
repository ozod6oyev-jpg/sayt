type Block =
  | { type: "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "figure"; src: string; caption: string };

function parseBlocks(body: string): Block[] {
  const chunks = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: Block[] = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n");

    // Rasm: ![izoh](/rasm.jpg)
    const image = chunk.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      blocks.push({ type: "figure", caption: image[1].trim(), src: image[2].trim() });
      continue;
    }

    if (lines.every((line) => line.trim().startsWith("- "))) {
      blocks.push({
        type: "ul",
        items: lines.map((line) => line.trim().slice(2).trim()),
      });
      continue;
    }

    if (lines.every((line) => line.trim().startsWith("> "))) {
      blocks.push({
        type: "quote",
        text: lines.map((line) => line.trim().slice(2).trim()).join(" "),
      });
      continue;
    }

    if (chunk.startsWith("### ")) {
      blocks.push({ type: "h3", text: chunk.slice(4).trim() });
      continue;
    }

    if (chunk.startsWith("## ")) {
      blocks.push({ type: "h2", text: chunk.slice(3).trim() });
      continue;
    }

    blocks.push({ type: "p", text: chunk.replace(/\n/g, " ").trim() });
  }

  return blocks;
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = parseBlocks(body);

  return (
    <div className="article-body">
      {blocks.map((block, index) => {
        if (block.type === "ul") {
          return (
            <ul key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "figure") {
      return (
        <figure key={index}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.caption} loading="lazy" decoding="async" />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      );
    }

    if (block.type === "h2") {
          return <h2 key={index}>{block.text}</h2>;
        }

        if (block.type === "h3") {
          return <h3 key={index}>{block.text}</h3>;
        }

        if (block.type === "quote") {
          return <blockquote key={index}>{block.text}</blockquote>;
        }

        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
