import type { Borders, Fill, Font } from 'exceljs';

const BRAND = 'FF1A56DB';
const HEADER_FONT: Partial<Font> = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
const TITLE_FONT: Partial<Font> = { bold: true, size: 16, color: { argb: BRAND } };
const SUBTITLE_FONT: Partial<Font> = { size: 10, color: { argb: 'FF64748B' }, italic: true };

const HEADER_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: BRAND },
};

const STRIPE_FILL: Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
};

const CELL_BORDER: Partial<Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

function sanitizeSheetName(name: string): string {
  return name.replace(/[[\]*?:/\\]/g, '').slice(0, 31) || 'Отчёт';
}

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Табличный отчёт в .xlsx: заголовок, дата, шапка с заливкой, чередование строк, автоширина.
 */
export async function downloadFormattedTableXlsx(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string,
  sheetName?: string,
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'МГИРО';
  wb.created = new Date();

  const colCount = Math.max(headers.length, 1);
  const ws = wb.addWorksheet(sanitizeSheetName(sheetName ?? title), {
    views: [{ state: 'frozen', ySplit: 3, activeCell: 'A4' }],
    properties: { defaultRowHeight: 20 },
  });

  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = TITLE_FONT;
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, colCount);
  const subCell = ws.getCell(2, 1);
  subCell.value = `Сформировано: ${new Date().toLocaleString('ru-RU')}`;
  subCell.font = SUBTITLE_FONT;
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  const headerRow = ws.getRow(3);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = CELL_BORDER;
  });
  headerRow.height = 24;

  rows.forEach((row, rIdx) => {
    const excelRow = ws.getRow(4 + rIdx);
    headers.forEach((_, cIdx) => {
      const cell = excelRow.getCell(cIdx + 1);
      cell.value = row[cIdx] ?? '—';
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = CELL_BORDER;
      if (rIdx % 2 === 1) {
        cell.fill = STRIPE_FILL;
      }
    });
  });

  headers.forEach((h, colIdx) => {
    let maxLen = h.length;
    rows.forEach((r) => {
      maxLen = Math.max(maxLen, String(r[colIdx] ?? '').length);
    });
    ws.getColumn(colIdx + 1).width = Math.min(Math.max(maxLen + 3, 12), 50);
  });

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}
