import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programsApi, personsApi } from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Download, Users, Calendar, Eye, MessageCircle } from 'lucide-react';
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
  const [showPreview, setShowPreview] = useState(true);

  // Estados para datos editables
  const [churchName, setChurchName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
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
        
        // Cargar nombre de iglesia y logo
        setChurchName(prog.churchName || '');
        setLogoUrl(prog.logoUrl || '');

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
        churchName,
        logoUrl,
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

  const displayTime = programTime ? `${programTime} ${timePeriod}` : '';

  const availablePersons = allPersons.filter(
    p => p.status === 'ACTIVE' && !cleaningMembers.some(m => m.id === p._id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
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
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">{showPreview ? 'Ocultar' : 'Mostrar'} Preview</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={() => navigate(`/programs/share-whatsapp?ids=${id}`)}
                className="flex items-center gap-2 px-3 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition text-sm hidden sm:flex"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Info básica */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                Información del Programa
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Iglesia
                  </label>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL del Logo de la Iglesia
                  </label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {logoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img 
                        src={logoUrl} 
                        alt="Vista previa del logo" 
                        className="w-12 h-12 object-contain rounded border"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="%23999"%3E❌%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <span className="text-xs text-gray-500">Vista previa</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Versículo (Footer)
                  </label>
                  <input
                    type="text"
                    value={verse}
                    onChange={(e) => setVerse(e.target.value)}
                    placeholder="Ej: Colosenses 3:23"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texto del versículo (opcional)
                  </label>
                  <textarea
                    value={verseText}
                    onChange={(e) => setVerseText(e.target.value)}
                    placeholder="Y todo lo que hagáis, hacedlo de corazón..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Miembros del grupo */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Miembros del Grupo {program?.assignedGroupNumber}
                <span className="ml-auto text-sm font-normal text-gray-500">
                  {cleaningMembers.length} personas
                </span>
              </h2>

              {/* Agregar miembro */}
              <div className="mb-4">
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
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="sticky top-24">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Vista Previa del Flyer
                </h3>
                <span className="flex items-center gap-2 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Se actualiza en tiempo real
                </span>
              </div>

              {/* Flyer Preview */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2c4875] to-[#3d5a80] px-8 py-6 flex flex-col items-center justify-center text-center gap-4">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo de la iglesia" 
                      className="w-24 h-24 object-contain rounded-xl bg-white/10 p-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/15 border-2 border-white/30 rounded-xl flex items-center justify-center text-5xl">
                      🕊
                    </div>
                  )}
                  <h1 className="text-white text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {churchName || 'Nombre de la Iglesia'}
                  </h1>
                </div>

                {/* Gold Band */}
                <div className="h-1.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

                {/* Badge */}
                <div className="flex justify-center py-6">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-[#1B2D5B] px-8 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {program?.activityType?.name || 'Programa de Limpieza'}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="text-center px-8 pb-2">
                  <div className="text-[#1B2D5B] text-lg font-semibold capitalize" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {formattedDate}
                  </div>
                  <div className="text-gray-600 text-base mt-1">{displayTime}</div>
                </div>

                {/* Ornament */}
                <div className="flex items-center gap-3 px-8 py-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 opacity-60"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rotate-45"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rotate-45 opacity-60"></span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                <div className="text-center text-xs font-bold uppercase tracking-widest text-[#2c4875] pb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Grupo {program?.assignedGroupNumber}
                </div>

                {/* Members List */}
                <div className="px-6 pb-6 space-y-2">
                  {cleaningMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic">
                      No hay miembros asignados
                    </div>
                  ) : (
                    cleaningMembers.map((member, index) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-center px-4 py-3 rounded-lg ${
                          index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-[#2c4875] text-amber-400 rounded-lg flex items-center justify-center text-xs font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {member.name}
                          </div>
                          {member.phone && (
                            <div className="text-xs text-gray-500 mt-1">{member.phone}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Verse */}
                {verse && (
                  <div className="text-center px-8 pb-4">
                    <div className="text-xs italic text-gray-500" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {verseText && <div className="mb-1">"{verseText}"</div>}
                      <div className="text-amber-600 font-semibold">{verse}</div>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="bg-[#2c4875] py-4 text-center">
                  <div className="text-white/85 text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {churchName || 'Nombre de la Iglesia'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleaningProgramEditPage;
