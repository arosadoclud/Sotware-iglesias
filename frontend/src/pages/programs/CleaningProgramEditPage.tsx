import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programsApi, personsApi } from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Download, Users, Calendar, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface CleaningMember {
  id: string;
  name: string;
  phone?: string;
}

const CleaningProgramEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [cleaningMembers, setCleaningMembers] = useState<CleaningMember[]>([]);
  const [allPersons, setAllPersons] = useState<any[]>([]);

  // Estados para datos editables
  const [programDate, setProgramDate] = useState('');
  const [programTime, setProgramTime] = useState('');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
  const [verse, setVerse] = useState('');
  const [verseText, setVerseText] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        // Cargar programa
        const progRes = await programsApi.get(id);
        const prog = progRes.data.data;

        // Verificar que sea un programa de limpieza
        if (prog.generationType !== 'cleaning_groups') {
          toast.error('Este no es un programa de limpieza');
          navigate(`/programs/edit/${id}`);
          return;
        }

        setProgram(prog);
        setCleaningMembers(prog.cleaningMembers || []);

        // Cargar fecha
        setProgramDate(prog.programDate ? prog.programDate.slice(0, 10) : '');

        // Parsear hora
        if (prog.programTime) {
          const hasPM = /PM/i.test(prog.programTime);
          const hasAM = /AM/i.test(prog.programTime);
          if (hasPM || hasAM) {
            const clean = prog.programTime.replace(/\s*(AM|PM)\s*/gi, '').trim();
            setProgramTime(clean);
            setTimePeriod(hasPM ? 'PM' : 'AM');
          } else {
            const parts = prog.programTime.split(':');
            const h = parseInt(parts[0]);
            const m = parts[1] || '00';
            const isPM = h >= 12;
            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            setProgramTime(`${h12}:${m}`);
            setTimePeriod(isPM ? 'PM' : 'AM');
          }
        } else {
          setProgramTime('10:00');
          setTimePeriod('AM');
        }

        setVerse(prog.verse || '');
        setVerseText(prog.verseText || '');

        // Cargar todas las personas para poder agregar/cambiar miembros
        const personsRes = await personsApi.getAll();
        setAllPersons(personsRes.data.data || []);
      } catch (error) {
        toast.error('No se pudo cargar el programa');
        navigate('/programs');
      }
      setLoading(false);
    }
    fetchData();
  }, [id, navigate]);

  const handleAddMember = (personId: string) => {
    const person = allPersons.find(p => p._id === personId);
    if (!person) return;

    // Verificar que no esté ya agregado
    if (cleaningMembers.some(m => m.id === person._id)) {
      toast.error('Esta persona ya está en el grupo');
      return;
    }

    setCleaningMembers([
      ...cleaningMembers,
      { id: person._id, name: person.name, phone: person.phone || '' }
    ]);
  };

  const handleRemoveMember = (memberId: string) => {
    setCleaningMembers(cleaningMembers.filter(m => m.id !== memberId));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const formattedTime = `${programTime} ${timePeriod}`;

      await programsApi.update(id, {
        ...program,
        programDate: programDate ? `${programDate}T12:00:00` : programDate,
        programTime: formattedTime,
        defaultTime: formattedTime,
        verse,
        verseText,
        cleaningMembers,
      });
      
      toast.success('✅ Programa de limpieza guardado exitosamente');
    } catch (error) {
      toast.error('❌ Error al guardar el programa');
      console.error(error);
    }
    setSaving(false);
  };

  const handleDownloadPDF = () => {
    if (id) {
      window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/programs/${id}/flyer`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!program) return null;

  const formattedDate = new Date(programDate + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const availablePersons = allPersons.filter(
    p => p.status === 'ACTIVE' && !cleaningMembers.some(m => m.id === p._id)
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/programs')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Volver a Programas</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50 text-sm font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Título */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {program.activityType?.name || 'Programa de Limpieza'}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">
              GRUPO {program.assignedGroupNumber} de {program.totalGroups}
            </span>
            <span className="text-gray-400">•</span>
            <span>{cleaningMembers.length} personas</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Información básica */}
          <div className="space-y-6">
            {/* Fecha y hora */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Fecha y Hora
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha del programa
                  </label>
                  <input
                    type="date"
                    value={programDate}
                    onChange={(e) => setProgramDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-sm text-gray-500 capitalize">{formattedDate}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={programTime}
                      onChange={(e) => setProgramTime(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value as 'AM' | 'PM')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Versículo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  Versículo Bíblico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={verse}
                    onChange={(e) => setVerse(e.target.value)}
                    placeholder="Ej: Juan 3:16"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto (opcional)
                  </label>
                  <textarea
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    placeholder="Porque de tal manera amó Dios al mundo..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho: Miembros del grupo */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary-600" />
                  Miembros del Grupo {program.assignedGroupNumber}
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {cleaningMembers.length} personas
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Agregar miembro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agregar miembro
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddMember(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    defaultValue=""
                  >
                    <option value="" disabled>Seleccionar persona...</option>
                    {availablePersons.map(person => (
                      <option key={person._id} value={person._id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lista de miembros */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cleaningMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No hay miembros en este grupo</p>
                      <p className="text-xs mt-1">Agrega personas usando el selector arriba</p>
                    </div>
                  ) : (
                    cleaningMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            {member.phone && (
                              <p className="text-xs text-gray-500">{member.phone}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                ℹ️
              </div>
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Sobre los grupos de limpieza</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Los miembros se rotan automáticamente entre los grupos</li>
                  <li>• Puedes agregar o quitar personas según las necesidades</li>
                  <li>• Los cambios se guardan al presionar "Guardar"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CleaningProgramEditPage;
