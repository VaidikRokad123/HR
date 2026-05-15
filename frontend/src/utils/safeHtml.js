export function sanitizeHtml(value = '') {
  const template = document.createElement('template');
  template.innerHTML = String(value);

  template.content.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());
  template.content.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name) || /^javascript:/i.test(attr.value)) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return template.innerHTML;
}
