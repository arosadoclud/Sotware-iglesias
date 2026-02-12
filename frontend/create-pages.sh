#!/bin/bash

# ActivityTypesPage
cat > src/pages/activities/ActivityTypesPage.tsx << 'EOF'
import { Plus } from 'lucide-react'

const ActivityTypesPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Actividades</h1>
        <button className="btn btn-primary"><Plus className="w-5 h-5 mr-2" /> Nueva</button>
      </div>
      <div className="card"><p>Lista de actividades...</p></div>
    </div>
  )
}
export default ActivityTypesPage
EOF

# ProgramsPage
cat > src/pages/programs/ProgramsPage.tsx << 'EOF'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const ProgramsPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Programas</h1>
        <Link to="/programs/generate" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" /> Generar Programa
        </Link>
      </div>
      <div className="card"><p>Lista de programas generados...</p></div>
    </div>
  )
}
export default ProgramsPage
EOF

# GenerateProgramPage
cat > src/pages/programs/GenerateProgramPage.tsx << 'EOF'
const GenerateProgramPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Generar Programa</h1>
      <div className="card"><p>Wizard para generar programa...</p></div>
    </div>
  )
}
export default GenerateProgramPage
EOF

# CalendarPage
cat > src/pages/CalendarPage.tsx << 'EOF'
const CalendarPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Calendario</h1>
      <div className="card"><p>Vista de calendario de programas...</p></div>
    </div>
  )
}
export default CalendarPage
EOF

# LetterTemplatesPage
cat > src/pages/letters/LetterTemplatesPage.tsx << 'EOF'
import { Plus } from 'lucide-react'

const LetterTemplatesPage = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plantillas de Cartas</h1>
        <button className="btn btn-primary"><Plus className="w-5 h-5 mr-2" /> Nueva</button>
      </div>
      <div className="card"><p>Lista de plantillas...</p></div>
    </div>
  )
}
export default LetterTemplatesPage
EOF

# SettingsPage
cat > src/pages/SettingsPage.tsx << 'EOF'
const SettingsPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Información de la Iglesia</h3>
          <p className="text-gray-600">Configuración de la iglesia...</p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-4">Preferencias</h3>
          <p className="text-gray-600">Configuración del sistema...</p>
        </div>
      </div>
    </div>
  )
}
export default SettingsPage
EOF

echo "Páginas creadas exitosamente"
