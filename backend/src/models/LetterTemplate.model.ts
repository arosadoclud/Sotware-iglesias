import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface para el documento
export interface ILetterTemplate extends Document {
  _id: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  content: any; // JSON structure del editor (TipTap)
  variables: string[]; // Lista de placeholders disponibles
  createdBy: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  extractVariables(): string[];
  replaceVariables(data: Record<string, string>): string;
}

// Schema
const LetterTemplateSchema = new Schema<ILetterTemplate>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: [true, 'El ID de la iglesia es requerido'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la plantilla es requerido'],
      trim: true,
      maxlength: [255, 'El nombre no puede exceder 255 caracteres'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es requerida'],
      trim: true,
      maxlength: [100, 'La categoría no puede exceder 100 caracteres'],
      default: 'General',
    },
    content: {
      type: Schema.Types.Mixed, // Permite cualquier estructura JSON
      required: [true, 'El contenido es requerido'],
    },
    variables: {
      type: [String],
      default: [],
    },
    createdBy: {
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
  },
  {
    timestamps: true,
    collection: 'letterTemplates',
  }
);

// Índices
LetterTemplateSchema.index({ churchId: 1, name: 1 });
LetterTemplateSchema.index({ churchId: 1, category: 1 });

// Método: extraer variables del contenido
LetterTemplateSchema.methods.extractVariables = function (): string[] {
  const contentStr = JSON.stringify(this.content);
  const regex = /\{\{([A-Z_]+)\}\}/g;
  const matches = contentStr.matchAll(regex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
};

// Método: reemplazar variables en el contenido
LetterTemplateSchema.methods.replaceVariables = function (
  data: Record<string, string>
): string {
  let contentStr = JSON.stringify(this.content);
  
  // Reemplazar cada variable
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    contentStr = contentStr.replace(regex, value);
  }
  
  return contentStr;
};

// Actualizar lista de variables antes de guardar
LetterTemplateSchema.pre('save', function (next) {
  this.variables = this.extractVariables();
  next();
});

// Exportar modelo
const LetterTemplate: Model<ILetterTemplate> = mongoose.model<ILetterTemplate>(
  'LetterTemplate',
  LetterTemplateSchema
);
export default LetterTemplate;
