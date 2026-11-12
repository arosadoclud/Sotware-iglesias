import mongoose from 'mongoose';
import Person from '../../../models/Person.model';
import Program from '../../../models/Program.model';
import ActivityType from '../../../models/ActivityType.model';
import { AssignmentEngine } from './AssignmentEngine';

test('reserva la persona seleccionada para Mensaje antes de asignar Dirección', async () => {
  const messageId = new mongoose.Types.ObjectId();
  const directionId = new mongoose.Types.ObjectId();
  const speakerId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();
  const persons = [
    { _id: speakerId, fullName: 'Predicadora', phone: '', roles: [
      { roleId: directionId, roleName: 'Dirección' },
      { roleId: messageId, roleName: 'Mensaje' }
    ], isAvailableOn: () => true },
    { _id: otherId, fullName: 'Director', phone: '', roles: [
      { roleId: directionId, roleName: 'Dirección' }
    ], isAvailableOn: () => true }
  ];
  const activity = { name: 'Culto Evangelístico', roleConfig: [
    { sectionName: 'Dirección', sectionOrder: 1, role: { id: directionId, name: 'Dirección' }, peopleNeeded: 1, isRequired: true },
    { sectionName: 'Mensaje', sectionOrder: 2, role: { id: messageId, name: 'Mensaje' }, peopleNeeded: 1, isRequired: true }
  ] };
  jest.spyOn(Person, 'find').mockReturnValue(Promise.resolve(persons) as any);
  jest.spyOn(Program, 'find').mockReturnValue({ lean: () => Promise.resolve([]) } as any);
  jest.spyOn(ActivityType, 'findOne').mockReturnValue({ lean: () => Promise.resolve(activity) } as any);

  const result = await new AssignmentEngine().generateOne({
    churchId: new mongoose.Types.ObjectId().toString(),
    activityTypeId: new mongoose.Types.ObjectId().toString(),
    targetDate: new Date('2026-11-15T12:00:00Z'),
    generatedBy: { id: 'test', name: 'Test' },
    restrictedPersonsForMessage: [speakerId.toString()]
  });

  expect(result.assignments.find(a => a.roleName === 'Mensaje')?.person.id.toString()).toBe(speakerId.toString());
  expect(result.assignments.find(a => a.roleName === 'Dirección')?.person.id.toString()).toBe(otherId.toString());
  expect(result.warnings).toHaveLength(0);
  expect(result.stats.coveragePercent).toBe(100);
});

test('admite un rol Mensaje antiguo cuando el selector ya muestra a la persona', async () => {
  const configuredRoleId = new mongoose.Types.ObjectId();
  const personId = new mongoose.Types.ObjectId();
  const person = { _id: personId, fullName: 'Mensajero', phone: '', roles: [
    { roleId: new mongoose.Types.ObjectId(), roleName: 'Mensaje' }
  ], isAvailableOn: () => true };
  const activity = { name: 'Culto Evangelístico', roleConfig: [
    { sectionName: 'Mensaje', sectionOrder: 1, role: { id: configuredRoleId, name: 'Mensaje' }, peopleNeeded: 1, isRequired: true }
  ] };
  jest.spyOn(Person, 'find').mockReturnValue(Promise.resolve([person]) as any);
  jest.spyOn(Program, 'find').mockReturnValue({ lean: () => Promise.resolve([]) } as any);
  jest.spyOn(ActivityType, 'findOne').mockReturnValue({ lean: () => Promise.resolve(activity) } as any);

  const result = await new AssignmentEngine().generateOne({
    churchId: new mongoose.Types.ObjectId().toString(),
    activityTypeId: new mongoose.Types.ObjectId().toString(),
    targetDate: new Date('2026-11-15T12:00:00Z'),
    generatedBy: { id: 'test', name: 'Test' },
    restrictedPersonsForMessage: [personId.toString()]
  });
  expect(result.assignments[0]?.person.id.toString()).toBe(personId.toString());
  expect(result.warnings).toHaveLength(0);
});
