import { Progress } from '../ui/progress'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

interface FieldStatus {
  label: string
  completed: boolean
  optional?: boolean
}

interface FormCompletenessProps {
  fields: FieldStatus[]
  className?: string
}

export const FormCompleteness: React.FC<FormCompletenessProps> = ({
  fields,
  className = '',
}) => {
  const requiredFields = fields.filter(f => !f.optional)
  const completedRequired = requiredFields.filter(f => f.completed).length
  const totalRequired = requiredFields.length
  const percentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0

  const optionalFields = fields.filter(f => f.optional)
  const completedOptional = optionalFields.filter(f => f.completed).length

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Completitud del Programa</h3>
        <span className="text-2xl font-bold text-slate-900">{Math.round(percentage)}%</span>
      </div>

      <Progress value={percentage} className="mb-4" />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Campos requeridos</span>
          <span className="font-medium text-slate-900">
            {completedRequired} / {totalRequired}
          </span>
        </div>
        
        {optionalFields.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Campos opcionales</span>
            <span className="font-medium text-slate-900">
              {completedOptional} / {optionalFields.length}
            </span>
          </div>
        )}
      </div>

      {/* Lista de campos */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Estado de Campos</p>
        <div className="space-y-1.5">
          {fields.map((field, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs"
            >
              {field.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : field.optional ? (
                <Circle className="h-4 w-4 text-slate-300 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              )}
              <span className={
                field.completed 
                  ? 'text-slate-700' 
                  : field.optional 
                    ? 'text-slate-400' 
                    : 'text-slate-900 font-medium'
              }>
                {field.label}
                {field.optional && <span className="text-slate-400 ml-1">(opcional)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {percentage === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">¡Programa completo!</p>
            <p className="text-xs text-green-700 mt-0.5">
              Todos los campos requeridos están llenos
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
