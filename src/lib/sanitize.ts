// Defensive sanitize pass for authored episode HTML. This content ships from
// public/data/Genesis/*.json — trusted first-party data, not user input — so
// this isn't an XSS trust boundary. It's a single belt-and-braces pass before
// the markup reaches dangerouslySetInnerHTML: drop <script>/<style> elements,
// strip any on* event-handler attributes, and neutralize javascript: URLs.
// Everything else (classes, headings, blockquotes, custom section markup) is
// left untouched.
const JAVASCRIPT_URL = /^\s*javascript:/i;

export function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';

  root.querySelectorAll('script, style').forEach((node) => node.remove());

  root.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src') && JAVASCRIPT_URL.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return root.innerHTML;
}
