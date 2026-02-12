import { Plus, FileText } from 'lucide-react'

const LetterTemplatesPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Cartas</h1>
          <p className="text-gray-600 mt-1">Gestiona plantillas para cartas e invitaciones</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2"><Plus className="w-5 h-5" /> Nueva Plantilla</button>
      </div>
      <div className="card text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">Módulo de cartas disponible próximamente</p>
        <p className="text-sm text-gray-400 mt-1">Podrás crear plantillas y generar cartas personalizadas</p>
      </div>
    </div>
  )
}
export default LetterTemplatesPage
