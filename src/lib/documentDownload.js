// ============================================================
// УТИЛИТЫ ДЛЯ СКАЧИВАНИЯ И ПЕЧАТИ ДОКУМЕНТОВ
// ============================================================

/**
 * Загружает HTML-содержимое документа по URL
 */
export async function fetchDocumentHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return await res.text();
}

/**
 * Объединяет массив HTML-документов в один файл с разрывами страниц
 * @param {Array<{title: string, html: string}>} docs
 * @returns {string} combined HTML
 */
export function combineHtmlDocuments(docs) {
  if (!docs || docs.length === 0) return '';

  // Все документы используют общий CSS из wrapHTML — извлекаем из первого
  const firstHtml = docs[0].html || '';
  const styleMatch = firstHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const css = styleMatch ? styleMatch[1] : '';

  // Извлекаем содержимое <body> из каждого документа
  const bodies = docs.map((d) => {
    const bodyMatch = d.html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch ? bodyMatch[1] : d.html;
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Пакет документов — БРО-СНБ</title>
<style>
${css}
</style>
</head>
<body>
${bodies
  .map(
    (body, idx) =>
      idx === 0
        ? body
        : `<div style="page-break-before: always;">${body}</div>`
  )
  .join('\n')}
</body>
</html>`;
}

/**
 * Скачивает строку как файл
 */
export function downloadBlob(content, filename, type = 'text/html') {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Печатает HTML-содержимое через скрытый iframe
 */
export function printHtmlContent(html) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
}

/**
 * Скачивает все документы одним файлом
 * @param {Array<{name: string, url: string}>} docs
 * @param {string} candidateName - для имени файла
 */
export async function downloadAllDocuments(docs, candidateName) {
  const allHtml = await Promise.all(
    docs.map(async (d) => ({
      title: d.name,
      html: await fetchDocumentHtml(d.url),
    }))
  );
  const combined = combineHtmlDocuments(allHtml);
  const filename = candidateName
    ? `Документы_${candidateName.replace(/\s+/g, '_')}.html`
    : 'Пакет_документов_БРО-СНБ.html';
  downloadBlob(combined, filename);
}

/**
 * Печатает все документы одним заданием
 * @param {Array<{name: string, url: string}>} docs
 */
export async function printAllDocuments(docs) {
  const allHtml = await Promise.all(
    docs.map(async (d) => ({
      title: d.name,
      html: await fetchDocumentHtml(d.url),
    }))
  );
  const combined = combineHtmlDocuments(allHtml);
  printHtmlContent(combined);
}