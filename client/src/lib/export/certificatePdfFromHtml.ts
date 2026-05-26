import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const W = 1200;
const H = 848;

function certHtml(listenerName: string, courseTitle: string, issuedAtLabel: string): string {
  const tag = 'div';
  return `
  <${tag} style="width:${W}px;height:${H}px;box-sizing:border-box;position:relative;overflow:hidden;
    background:radial-gradient(ellipse 75% 50% at 50% 8%, rgba(26,86,219,0.12) 0%, transparent 60%),
      linear-gradient(160deg,#fffef9 0%,#f8fafc 40%,#eef4ff 100%);
    font-family:Georgia,'Times New Roman',serif;color:#1e293b;">
    <${tag} style="position:absolute;inset:24px;border:3px double #b8956e;border-radius:6px;pointer-events:none;"></${tag}>
    <${tag} style="position:absolute;inset:32px;border:1px solid rgba(197,165,114,0.45);border-radius:4px;pointer-events:none;"></${tag}>
    <${tag} style="position:relative;z-index:2;padding:64px 88px 48px;text-align:center;height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;">
      <${tag} style="font-size:14px;letter-spacing:0.38em;color:#64748b;font-family:'Segoe UI',system-ui,sans-serif;font-weight:600;">МГИРО</${tag}>
      <${tag} style="margin-top:16px;width:120px;height:4px;background:linear-gradient(90deg,transparent,#1a56db,transparent);"></${tag}>
      <${tag} style="margin-top:12px;font-size:48px;font-weight:700;color:#1e3a5f;line-height:1.1;">Сертификат</${tag}>
      <${tag} style="margin-top:10px;font-size:16px;color:#64748b;font-style:italic;font-family:'Segoe UI',system-ui,sans-serif;">
        о прохождении программы повышения квалификации
      </${tag}>
      <${tag} style="margin-top:32px;width:70%;height:1px;background:linear-gradient(90deg,transparent,#94a3b8,transparent);"></${tag}>
      <${tag} style="margin-top:28px;font-size:14px;color:#475569;font-family:'Segoe UI',system-ui,sans-serif;">Настоящим удостоверяется, что</${tag}>
      <${tag} style="margin-top:16px;font-size:36px;font-weight:700;color:#1a56db;line-height:1.2;max-width:900px;">
        ${escapeHtml(listenerName)}
      </${tag}>
      <${tag} style="margin-top:22px;font-size:14px;color:#475569;font-family:'Segoe UI',system-ui,sans-serif;">успешно освоил(а) программу курса</${tag}>
      <${tag} style="margin-top:12px;font-size:24px;font-weight:700;color:#0f172a;line-height:1.35;max-width:940px;">
        «${escapeHtml(courseTitle)}»
      </${tag}>
      <${tag} style="margin-top:auto;padding-top:28px;width:100%;max-width:720px;font-family:'Segoe UI',system-ui,sans-serif;">
        <${tag} style="width:200px;border-top:1px solid #94a3b8;margin:0 auto 6px;"></${tag}>
        <${tag} style="font-size:11px;color:#64748b;">Дата выдачи</${tag}>
        <${tag} style="font-size:14px;color:#334155;font-weight:600;margin-top:2px;">${escapeHtml(issuedAtLabel)}</${tag}>
      </${tag}>
      <${tag} style="margin-top:24px;font-size:12px;color:#94a3b8;font-family:'Segoe UI',system-ui,sans-serif;line-height:1.5;">
        Минский государственный институт развития образования
      </${tag}>
    </${tag}>
  </${tag}>`;
}

export async function downloadCertificateStyledPdf(
  params: {
    listenerName: string;
    courseTitle: string;
    issuedAtLabel: string;
  },
  filename: string,
): Promise<void> {
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:fixed;left:-15000px;top:0;width:${W}px;height:${H}px;`;
  wrap.innerHTML = certHtml(params.listenerName, params.courseTitle, params.issuedAtLabel);
  document.body.appendChild(wrap);
  try {
    const canvas = await html2canvas(wrap.firstElementChild as HTMLElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: W,
      height: H,
    });
    const imgData = canvas.toDataURL('image/png', 0.95);
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pw, ph);
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } finally {
    document.body.removeChild(wrap);
  }
}
