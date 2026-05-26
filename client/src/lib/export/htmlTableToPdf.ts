import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PAGE_WIDTH_PX = 1120;
const ROWS_FIRST_PAGE = 20;
const ROWS_NEXT_PAGE = 24;

function chunkRows<T>(rows: T[], first: number, next: number): T[][] {
  if (rows.length === 0) return [[]];
  const pages: T[][] = [];
  let i = 0;
  pages.push(rows.slice(i, i + first));
  i += first;
  while (i < rows.length) {
    pages.push(rows.slice(i, i + next));
    i += next;
  }
  return pages;
}

function buildTableHtml(headers: string[], rows: string[][], title: string, pageIndex: number, totalPages: number) {
  const headCells = headers
    .map(
      (h) =>
        `<th style="border:1px solid #1e3a5f;padding:8px 10px;text-align:left;background:#1a56db;color:#fff;font-size:12px;">${escapeHtml(h)}</th>`,
    )
    .join('');
  const bodyRows = rows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c) =>
              `<td style="border:1px solid #cbd5e1;padding:6px 10px;font-size:11px;vertical-align:top;line-height:1.35;">${escapeHtml(String(c ?? '—'))}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');
  const sub =
    totalPages > 1
      ? `<p style="margin:0 0 12px;font-size:11px;color:#64748b;">Страница ${pageIndex + 1} из ${totalPages}</p>`
      : '';
  return `
    <div style="width:${PAGE_WIDTH_PX}px;padding:20px 24px 28px;background:#ffffff;box-sizing:border-box;
      font-family:'Segoe UI',Roboto,'Noto Sans',system-ui,sans-serif;color:#0f172a;">
      <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;">${escapeHtml(title)}</h2>
      <p style="margin:0 0 8px;font-size:11px;color:#64748b;">Сформировано: ${escapeHtml(new Date().toLocaleString('ru-RU'))}</p>
      ${sub}
      <table style="border-collapse:collapse;width:100%;table-layout:fixed;">
        <thead><tr>${headCells}</tr></thead>
        <tbody>${bodyRows || '<tr><td colspan="' + headers.length + '" style="padding:12px;color:#64748b;">Нет строк</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

/**
 * PDF с кириллицей: постраничный HTML → canvas → jsPDF (читаемо на длинных таблицах).
 */
export async function exportHtmlTableToPdf(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string,
): Promise<void> {
  const rowChunks = chunkRows(rows, ROWS_FIRST_PAGE, ROWS_NEXT_PAGE);
  const totalPages = Math.max(1, rowChunks.length);

  const pdf = new jsPDF('l', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;

  for (let p = 0; p < rowChunks.length; p++) {
    const wrap = document.createElement('div');
    wrap.setAttribute('data-export-pdf-page', String(p));
    wrap.style.cssText = `position:fixed;left:-14000px;top:0;background:#ffffff;`;
    wrap.innerHTML = buildTableHtml(headers, rowChunks[p], title, p, totalPages);
    document.body.appendChild(wrap);
    try {
      const canvas = await html2canvas(wrap, {
        scale: 1.65,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: PAGE_WIDTH_PX,
        windowWidth: PAGE_WIDTH_PX,
      });
      const imgData = canvas.toDataURL('image/png', 0.92);
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      let drawW = maxW;
      let drawH = (canvas.height * drawW) / canvas.width;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = (canvas.width * drawH) / canvas.height;
      }
      const x = (pageW - drawW) / 2;
      const y = (pageH - drawH) / 2;
      if (p > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
    } finally {
      document.body.removeChild(wrap);
    }
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
