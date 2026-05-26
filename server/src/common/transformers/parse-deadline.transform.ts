import { TransformFnParams } from 'class-transformer';

/**
 * Пустые значения → undefined; ISO / datetime-local / DD.MM.YYYY HH:mm → ISO 8601.
 */
export function transformDeadlineToIso({ value }: TransformFnParams): string | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const raw = String(value)
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/\u202f/g, ' ');
  if (!raw) return undefined;

  const ru = raw.match(
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

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString();

  return raw;
}
