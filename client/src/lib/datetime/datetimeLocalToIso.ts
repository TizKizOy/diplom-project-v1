/**
 * Значение из <input type="datetime-local">, ISO-строки или DD.MM.YYYY HH:mm
 * → ISO 8601 для NestJS @IsDateString().
 */
export function datetimeLocalToIso(value: string | undefined | null): string | undefined {
  if (value == null || !String(value).trim()) return undefined;
  const s = String(value)
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/\u202f/g, ' ');

  const ru = s.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})[.\s,/T]+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (ru) {
    const day = Number(ru[1]);
    const month = Number(ru[2]) - 1;
    const year = Number(ru[3]);
    const hour = Number(ru[4]);
    const minute = Number(ru[5]);
    const second = ru[6] ? Number(ru[6]) : 0;
    const d = new Date(year, month, day, hour, minute, second, 0);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  return undefined;
}
