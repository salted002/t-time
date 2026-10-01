/** '2025-03-02' 또는 ISO 문자열을 '2025.03.02'로 바꾼다. 값이 없거나 형식이 다르면 null */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}
