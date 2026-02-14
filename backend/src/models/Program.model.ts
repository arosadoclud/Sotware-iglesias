import mongoose, { Schema, Document, Model } from 'mongoose';

// Enum para status del programa
export enum ProgramStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Sub-documento para asignaciones
export interface IAssignment {
  _id?: mongoose.Types.ObjectId;
  sectionName: string;
  sectionOrder: number;
  roleName: string;
  person: {
    id: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
  };
  isManual: boolean;
  assignedAt: Date;
}

// Interface para el documento principal
export interface IProgram extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  activityType: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
  programDate: Date;
  status: ProgramStatus;
  assignments: IAssignment[];
  pdfUrl?: string;
  notes?: string;
  generatedBy: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // ✅ NUEVOS CAMPOS PARA PREVIEW = PDF
  churchName?: string;      // Nombre de iglesia editable
  subtitle?: string;        // Subtítulo editable
  programTime?: string;     // Hora en formato "7:00 PM"
  verse?: string;           // Versículo completo

  // ── CAMPOS PARA GRUPOS DE LIMPIEZA ──
  generationType?: 'standard' | 'cleaning_groups';
  assignedGroupNumber?: number;
  totalGroups?: number;
  cleaningMembers?: Array<{
    id: mongoose.Types.ObjectId;
    name: string;
    phone?: string;
  }>;

  // Métodos
  getAssignmentsBySection(sectionName: string): IAssignment[];
  getAssignmentsByPerson(personId: string | mongoose.Types.ObjectId): IAssignment[];
  removeAssignment(assignmentId: string | mongoose.Types.ObjectId): void;
  getTotalAssignments(): number;
}

// Schema para asignaciones
const AssignmentSchema = new Schema<IAssignment>(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    sectionOrder: {
      type: Number,
      required: true,
    },
    roleName: {
      type: String,
      required: true,
      trim: true,
    },
    person: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'Person',
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Schema principal de Program
const ProgramSchema = new Schema<IProgram>(
  {
    ampm: {
      type: String,
      enum: ['AM', 'PM'],
      default: 'AM',
    },
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    activityType: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'ActivityType',
        required: true,
        index: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    programDate: {
      type: Date,
      required: [true, 'La fecha del programa es requerida'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ProgramStatus),
      default: ProgramStatus.DRAFT,
      required: true,
    },
    assignments: {
      type: [AssignmentSchema],
      default: [],
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las notas no pueden exceder 1000 caracteres'],
    },
    generatedBy: {
      id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    
    // ✅ NUEVOS CAMPOS AGREGADOS - ESTOS FALTABAN
    churchName: {
      type: String,
      trim: true,
      required: false,
    },
    subtitle: {
      type: String,
      trim: true,
      required: false,
    },
    programTime: {
      type: String,
      trim: true,
      required: false,
    },
    verse: {
      type: String,
      trim: true,
      required: false,
      maxlength: [500, 'El versículo no puede exceder 500 caracteres'],
    },

    // ── CAMPOS PARA GRUPOS DE LIMPIEZA ──
    generationType: {
      type: String,
      enum: ['standard', 'cleaning_groups'],
      default: 'standard',
    },
    // Número de grupo asignado para esta fecha (1, 2, 3...)
    assignedGroupNumber: {
      type: Number,
      required: false,
    },
    // Total de grupos definidos
    totalGroups: {
      type: Number,
      required: false,
    },
    // Miembros del grupo asignado
    cleaningMembers: [{
      id: { type: Schema.Types.ObjectId, ref: 'Person' },
      name: { type: String },
      phone: { type: String },
    }],
  },
  {
    timestamps: true,
    collection: 'programs',
  }
);

// ─── ÍNDICES OPTIMIZADOS — Paso 4 ───────────────────────────────────────────
// Índice principal: la query más frecuente (lista de programas por iglesia+fecha)
ProgramSchema.index({ churchId: 1, programDate: -1 });

// Motor de asignación: busca programas recientes por iglesia+actividad en rango de fechas
ProgramSchema.index({ churchId: 1, 'activityType.id': 1, programDate: -1 });

// Dashboard: filtrar por estado (DRAFT/PUBLISHED/COMPLETED)
ProgramSchema.index({ churchId: 1, status: 1, programDate: -1 });

// Historial personal: buscar todos los programas donde participó una persona
ProgramSchema.index({ 'assignments.person.id': 1, programDate: -1 });

// HistoryAnalyzer: lookback de N semanas (la query más costosa del motor)
// Cubre: { churchId, programDate range, status }
ProgramSchema.index({ churchId: 1, programDate: 1, status: 1 });

// Ordenar assignments por sectionOrder antes de guardar
ProgramSchema.pre('save', function (next) {
  if (this.assignments && this.assignments.length > 0) {
    this.assignments.sort((a, b) => a.sectionOrder - b.sectionOrder);
  }
  next();
});

// Método: obtener asignaciones por sección
ProgramSchema.methods.getAssignmentsBySection = function (
  sectionName: string
): IAssignment[] {
  return this.assignments.filter(
    (assignment: IAssignment) => assignment.sectionName === sectionName
  );
};

// Método: obtener asignaciones de una persona
ProgramSchema.methods.getAssignmentsByPerson = function (
  personId: string | mongoose.Types.ObjectId
): IAssignment[] {
  const personIdStr = personId.toString();
  return this.assignments.filter(
    (assignment: IAssignment) => assignment.person.id.toString() === personIdStr
  );
};

// Método: remover asignación
ProgramSchema.methods.removeAssignment = function (
  assignmentId: string | mongoose.Types.ObjectId
): void {
  const assignmentIdStr = assignmentId.toString();
  this.assignments = this.assignments.filter(
    (assignment: IAssignment) => assignment._id?.toString() !== assignmentIdStr
  );
};

// Método: obtener total de asignaciones
ProgramSchema.methods.getTotalAssignments = function (): number {
  return this.assignments.length;
};

// Validación: no permitir programas duplicados (misma iglesia, actividad y fecha)
ProgramSchema.index(
  { churchId: 1, 'activityType.id': 1, programDate: 1 },
  { unique: true }
);

// Exportar modelo
const Program: Model<IProgram> = mongoose.model<IProgram>('Program', ProgramSchema);
export default Program;
