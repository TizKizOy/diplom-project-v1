import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

function tableCell(text: string, bold = false) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: text || '—', bold, size: 22 })],
      }),
    ],
  });
}

/** Сохранение табличного отчёта в настоящий .docx (библиотека docx). */
export async function downloadTableDocx(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string,
) {
  const headerRow = new TableRow({
    children: headers.map((h) => tableCell(h, true)),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map((c) => tableCell(c)),
      }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.TITLE,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Сформировано: ${new Date().toLocaleString('ru-RU')}`,
                size: 20,
                color: '64748B',
              }),
            ],
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadCertificateDocx(params: {
  listenerName: string;
  courseTitle: string;
  issuedAtLabel: string;
  templateName?: string;
}, filename: string) {
  const { listenerName, courseTitle, issuedAtLabel, templateName } = params;
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({ text: 'МГИРО', bold: true, size: 28, color: '1a56db' }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'СЕРТИФИКАТ', bold: true, size: 56 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: 'об успешном прохождении курса повышения квалификации',
                size: 24,
                italics: true,
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'Настоящим подтверждается, что', size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: listenerName, bold: true, size: 40, color: '1a56db' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: 'успешно прошёл(а) курс', size: 22 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({ text: courseTitle, bold: true, size: 32 })],
          }),
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({ text: `Дата выдачи: ${issuedAtLabel}`, size: 22 })],
          }),
          ...(templateName
            ? [
                new Paragraph({
                  children: [new TextRun({ text: `Шаблон: ${templateName}`, size: 20, color: '64748B' })],
                }),
              ]
            : []),
          new Paragraph({
            spacing: { before: 600 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'Минский государственный институт развития образования',
                size: 20,
                color: '64748B',
              }),
            ],
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
