import { transactionTextFilter } from './transactionFilters';

describe('Financial transaction search', () => {
  it('does not constrain empty or non-string searches', () => {
    expect(transactionTextFilter(' ')).toEqual({});
    expect(transactionTextFilter({ $ne: '' })).toEqual({});
  });
  it('searches descriptions and references with a literal escaped pattern', () => {
    const filter = transactionTextFilter(' TRF.2026+(01) ');
    const pattern = filter.$or[0].description.$regex;
    expect(new RegExp(pattern, 'i').test('Referencia TRF.2026+(01)')).toBe(true);
    expect(new RegExp(pattern, 'i').test('TRFx202601')).toBe(false);
    expect(filter.$or[1].reference.$regex).toBe(pattern);
  });
  it('limits the search length and leaves tenant and amount filters untouched', () => {
    const filter: any = { church: 'church1', type: 'INCOME', ...transactionTextFilter('a'.repeat(200)) };
    expect(filter.church).toBe('church1');
    expect(filter.type).toBe('INCOME');
    expect(filter.$or[0].description.$regex).toHaveLength(120);
  });
});

