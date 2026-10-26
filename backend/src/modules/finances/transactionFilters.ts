/** Search text is treated literally, never as a caller-provided regex. */
export function transactionTextFilter(value: unknown): Record<string, any> {
  if (typeof value !== 'string' || !value.trim()) return {};
  const literal = value.trim().slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { $or: [
    { description: { $regex: literal, $options: 'i' } },
    { reference: { $regex: literal, $options: 'i' } },
  ] };
}
