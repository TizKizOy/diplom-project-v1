/**
 * Достаёт человекочитаемое сообщение из ответа NestJS / axios.
 */
const FIELD_LABELS: Record<string, string> = {
  answerFileUrl: 'Ссылка на файл',
  answerText: 'Текст ответа',
  fullName: 'ФИО',
  email: 'Email',
  phone: 'Телефон',
  login: 'Логин',
  password: 'Пароль',
  title: 'Название',
  name: 'Название',
  deadline: 'Дедлайн',
  maxScore: 'Максимальный балл',
  statusId: 'Статус',
  score: 'Балл',
};

const CONSTRAINT_MESSAGES: Record<string, string> = {
  isUrl: 'укажите полную ссылку (например https://disk.yandex.ru/...)',
  isEmail: 'некорректный email',
  minLength: 'слишком короткое значение',
  maxLength: 'слишком длинное значение',
  isInt: 'должно быть целым числом',
  isString: 'должно быть текстом',
};

function formatValidationItem(item: unknown): string {
  if (typeof item === 'string') {
    return item.replace(/\b\w+ must be a URL address\b/i, `${FIELD_LABELS.answerFileUrl}: укажите полную ссылку (https://...)`);
  }
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    const field = String(o.property ?? o.field ?? '');
    const constraints = o.constraints as Record<string, string> | undefined;
    if (constraints) {
      const firstKey = Object.keys(constraints)[0];
      const label = FIELD_LABELS[field] ?? field;
      const hint = CONSTRAINT_MESSAGES[firstKey];
      if (hint) return `${label}: ${hint}`;
      const raw = Object.values(constraints)[0];
      if (typeof raw === 'string') return `${label}: ${raw}`;
    }
  }
  return typeof item === 'object' ? JSON.stringify(item) : String(item);
}

export function getApiErrorMessage(err: unknown, fallback = 'Произошла ошибка'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: unknown } } }).response?.data;
    const msg = data?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (Array.isArray(msg) && msg.length) {
      return msg.map(formatValidationItem).filter(Boolean).join('\n');
    }
  }
  if (err instanceof Error && err.message) {
    return err.message.replace(/\b\w+ must be a URL address\b/i, `${FIELD_LABELS.answerFileUrl}: укажите полную ссылку (https://...)`);
  }
  return fallback;
}
