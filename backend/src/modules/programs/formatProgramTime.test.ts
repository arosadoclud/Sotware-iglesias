import { formatProgramTime } from './formatProgramTime';
describe('Printed program time', () => {
  it.each([['9:00 AM','AM','9:00 AM'],['7:30 PM','AM','7:30 PM'],['19:30',undefined,'7:30 PM'],['00:00',undefined,'12:00 AM'],['09:00','PM','9:00 PM']])('formats %s without a duplicate suffix', (time,period,expected) => {
    expect(formatProgramTime(time!,period)).toBe(expected);
  });
  it('rejects invalid values',()=>{ expect(formatProgramTime('25:90')).toBe(''); });
});
