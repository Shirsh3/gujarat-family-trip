/**
 * Safe Markdown → DOM renderer shared by chatbot and hotel research UIs.
 * Builds elements with textContent; only http(s) links are clickable.
 */
(function (root, factory) {
  const api = factory();
  root.TripMarkdown = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this, function () {
  function appendInline(parent, value) {
    const token =
      /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)/g;
    let last = 0;
    let m;
    while ((m = token.exec(value))) {
      if (m.index > last) parent.appendChild(document.createTextNode(value.slice(last, m.index)));
      if (m[1]) {
        const b = document.createElement("strong");
        b.textContent = m[1];
        parent.appendChild(b);
      } else if (m[2]) {
        const em = document.createElement("em");
        em.textContent = m[2];
        parent.appendChild(em);
      } else {
        const a = document.createElement("a");
        a.href = m[4] || m[5];
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = m[3] || m[5];
        parent.appendChild(a);
      }
      last = token.lastIndex;
    }
    if (last < value.length) parent.appendChild(document.createTextNode(value.slice(last)));
  }

  function isTableRow(line) {
    const t = line.trim();
    return t.startsWith("|") && t.endsWith("|");
  }

  function cells(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((x) => x.trim());
  }

  function isSeparator(line) {
    return isTableRow(line) && cells(line).every((x) => /^:?-{3,}:?$/.test(x));
  }

  function renderMarkdown(container, markdown, options) {
    const opts = options || {};
    container.replaceChildren();
    if (opts.className) container.className = opts.className;
    const source = String(markdown || "")
      .replace(/\r/g, "")
      .replace(/\\\|/g, "|")
      .replace(/\\\*/g, "*")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")");
    const lines = source.split("\n");
    let list = null;
    let listType = "";
    let card = null;

    const ensureCard = () => {
      if (!opts.cardClass) return container;
      if (!card) {
        card = document.createElement("article");
        card.className = opts.cardClass;
        container.appendChild(card);
      }
      return card;
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();
      if (!line) {
        list = null;
        listType = "";
        continue;
      }

      if (isTableRow(line) && i + 1 < lines.length && isSeparator(lines[i + 1])) {
        list = null;
        listType = "";
        const target = ensureCard();
        const wrap = document.createElement("div");
        wrap.className = opts.tableWrapClass || "chat-table-wrap";
        const table = document.createElement("table");
        table.className = opts.tableClass || "chat-table";
        const head = document.createElement("thead");
        const hr = document.createElement("tr");
        cells(line).forEach((value) => {
          const th = document.createElement("th");
          appendInline(th, value);
          hr.appendChild(th);
        });
        head.appendChild(hr);
        table.appendChild(head);
        const body = document.createElement("tbody");
        i += 2;
        while (i < lines.length && isTableRow(lines[i])) {
          const tr = document.createElement("tr");
          cells(lines[i]).forEach((value) => {
            const td = document.createElement("td");
            appendInline(td, value);
            tr.appendChild(td);
          });
          body.appendChild(tr);
          i++;
        }
        i--;
        table.appendChild(body);
        wrap.appendChild(table);
        target.appendChild(wrap);
        continue;
      }

      const heading = line.match(/^(#{1,3})\s+(.+)/);
      if (heading) {
        list = null;
        listType = "";
        if (opts.cardClass) {
          card = document.createElement("article");
          card.className = opts.cardClass;
          container.appendChild(card);
          const h = document.createElement("h3");
          appendInline(h, heading[2]);
          card.appendChild(h);
        } else {
          const el = document.createElement(heading[1].length === 1 ? "h2" : "h3");
          appendInline(el, heading[2]);
          container.appendChild(el);
        }
        continue;
      }

      const bullet = line.match(/^[-*•]\s+(.+)/);
      const number = line.match(/^\d+[.)]\s+(.+)/);
      if (bullet || number) {
        const type = bullet ? "ul" : "ol";
        const target = ensureCard();
        if (!list || listType !== type) {
          list = document.createElement(type);
          target.appendChild(list);
          listType = type;
        }
        const li = document.createElement("li");
        appendInline(li, (bullet || number)[1]);
        list.appendChild(li);
        continue;
      }

      list = null;
      listType = "";
      const target = ensureCard();
      // Label:value only when it is not Markdown emphasis (avoids breaking **Exact property: ...**).
      const labelMatch = line.match(/^([^:*`\[\]#]{1,40}):\s+(.+)$/);
      if (labelMatch && !/\*\*|__/.test(line)) {
        const p = document.createElement("p");
        const b = document.createElement("strong");
        appendInline(b, labelMatch[1] + ":");
        p.appendChild(b);
        p.appendChild(document.createTextNode(" "));
        appendInline(p, labelMatch[2]);
        target.appendChild(p);
      } else {
        const p = document.createElement("p");
        appendInline(p, line);
        target.appendChild(p);
      }
    }
  }

  function renderSources(container, sources, options) {
    const opts = options || {};
    if (!Array.isArray(sources) || !sources.length) return;
    const box = document.createElement(opts.asCard ? "article" : "div");
    box.className = opts.className || "chat-source-links";
    const heading = document.createElement(opts.asCard ? "h3" : "strong");
    heading.textContent = opts.title || "Sources";
    box.appendChild(heading);
    const list = opts.asCard ? document.createElement("ul") : null;
    sources.forEach((source) => {
      if (!source || typeof source.url !== "string") return;
      if (!(source.url.startsWith("https://") || source.url.startsWith("http://"))) return;
      const a = document.createElement("a");
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = source.title || source.url;
      if (list) {
        const li = document.createElement("li");
        li.appendChild(a);
        list.appendChild(li);
      } else box.appendChild(a);
    });
    if (list) box.appendChild(list);
    container.appendChild(box);
  }

  return { renderMarkdown, renderSources, appendInline };
});
