import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programsApi } from '../../lib/api';
import { downloadBlob } from '../../lib/downloadHelper';
import { safeDateParse } from '../../lib/utils';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save, Download, Eye, MessageCircle } from 'lucide-react';

const ProgramEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  // Estados para datos editables - ESTOS SON LOS QUE SE GUARDAN
  const [churchName, setChurchName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [worshipType, setWorshipType] = useState('');
  const [programDate, setProgramDate] = useState('');
  const [programTime, setProgramTime] = useState('');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('PM');
  const [verse, setVerse] = useState('');

  useEffect(() => {
    async function fetchProgram() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await programsApi.get(id);
        const prog = res.data.data;
        
        // Si es un programa de limpieza, redirigir al editor específico
        if (prog.generationType === 'cleaning_groups') {
          navigate(`/programs/edit-cleaning/${id}`, { replace: true });
          return;
        }
        
        setProgram(prog);
        setAssignments(prog.assignments || []);
        
        // Cargar datos editables desde el programa O valores por defecto
        setChurchName(prog.churchName || 'IGLESIA ARCA EVANGELICA DIOS FUERTE');
        setSubtitle(prog.subtitle || '');
        setWorshipType(prog.activityType?.name || 'CULTO DE JÓVENES');
        setProgramDate(prog.programDate ? prog.programDate.slice(0, 10) : '');
        
        // Si programTime existe, usarlo, sino default
        if (prog.programTime) {
          const hasPM = /PM/i.test(prog.programTime);
          const hasAM = /AM/i.test(prog.programTime);
          if (hasPM || hasAM) {
            // Ya viene en formato 12h "7:00 PM"
            const clean = prog.programTime.replace(/\s*(AM|PM)\s*/gi, '').trim();
            const [h, m] = clean.split(':');
            setProgramTime(`${h.padStart(2, '0')}:${m?.padStart(2, '0') || '00'}`);
            setTimePeriod(hasPM ? 'PM' : 'AM');
          } else {
            // Formato 24h "19:00" → convertir a 12h
            const parts = prog.programTime.split(':');
            const h = parseInt(parts[0]);
            const m = parts[1] || '00';
            const isPM = h >= 12;
            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            setProgramTime(`${String(h12).padStart(2, '0')}:${m.padStart(2, '0')}`);
            setTimePeriod(isPM ? 'PM' : 'AM');
          }
        } else {
          setProgramTime('07:00');
          setTimePeriod('PM');
        }
        
        setVerse(prog.verse || '');
      } catch {
        toast.error('No se pudo cargar el programa');
        navigate('/programs');
      }
      setLoading(false);
    }
    fetchProgram();
  }, [id, navigate]);

  const handleAssignmentChange = (index: number, field: string, value: string) => {
    const updated = [...assignments];
    if (field === 'personName') {
      updated[index] = { 
        ...updated[index], 
        person: { ...updated[index].person, fullName: value } 
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setAssignments(updated);
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      // Convertir hora a formato guardado con AM/PM
      const formattedTime = `${programTime} ${timePeriod}`;

      // Guardar con TODOS los datos exactos del preview
      await programsApi.update(id, {
        ...program,
        churchName,      // ✅ Guardar nombre de iglesia
        subtitle,        // ✅ Guardar subtítulo
        verse,           // ✅ Guardar versículo completo
        programTime: formattedTime,     // ✅ Guardar hora en formato "7:00 PM"
        defaultTime: formattedTime,     // ✅ También guardar en defaultTime
        ampm: timePeriod,               // ✅ Guardar período AM/PM
        programDate: programDate ? `${programDate.slice(0, 10)}T12:00:00` : programDate,     // ✅ Guardar fecha
        activityType: {
          ...program.activityType,
          name: worshipType  // ✅ Guardar tipo de culto
        },
        assignments: assignments.map((a, idx) => ({
          ...a,
          id: idx + 1,
          sectionOrder: idx + 1,
          person: a.person?._id || null,
          roleName: a.roleName,
        }))
      });
      toast.success('✅ Programa guardado exitosamente');
    } catch (error) {
      toast.error('❌ Error al guardar el programa');
      console.error(error);
    }
    setSaving(false);
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      setSaving(true);
      const res = await programsApi.downloadFlyer(id);
      const dateStr = programDate ? programDate.split('T')[0] : new Date().toISOString().split('T')[0];
      const activitySlug = worshipType.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const filename = `${churchName.toLowerCase().replace(/\s+/g, '-')}-${activitySlug}-${dateStr}.pdf`;
      downloadBlob(new Blob([res.data]), filename);
      toast.success('✅ PDF descargado');
    } catch (error) {
      toast.error('❌ Error al descargar el PDF');
      console.error(error);
    } finally {
      setSaving(false);
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

  // Formatear fecha como en el preview
  const formattedDate = new Date(programDate + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Santo_Domingo'
  });

  // Hora en formato 12h para el preview
  const displayTime = programTime ? `${programTime} ${timePeriod}` : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/programs')}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Volver a Programas</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ocultar' : 'Mostrar'} Preview
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </button>
              <button
                onClick={() => navigate(`/programs/share-whatsapp?ids=${id}`)}
                className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-6">
            {/* Información General */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Información General</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Iglesia
                  </label>
                  <input
                    type="text"
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtítulo
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Culto
                    </label>
                    <input
                      type="text"
                      value={worshipType}
                      onChange={(e) => setWorshipType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={programDate}
                      onChange={(e) => setProgramDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={programTime}
                        onChange={(e) => {
                          let cleaned = e.target.value.replace(/[^0-9]/g, '');
                          if (cleaned.length >= 2) cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
                          if (cleaned.length > 5) cleaned = cleaned.slice(0, 5);
                          setProgramTime(cleaned);
                        }}
                        placeholder="7:00"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <select
                        value={timePeriod}
                        onChange={(e) => setTimePeriod(e.target.value as 'AM' | 'PM')}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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
                    placeholder="Ej: 1 Timoteo 4:12 Ninguno tenga en poco tu juventud..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Asignaciones */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Editar Asignaciones</h2>
              <div className="space-y-3">
                {assignments.map((assignment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rol</label>
                        <input
                          type="text"
                          value={assignment.roleName || ''}
                          onChange={(e) => handleAssignmentChange(index, 'roleName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Nombre del rol"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Persona</label>
                        <input
                          type="text"
                          value={assignment.person?.fullName || ''}
                          onChange={(e) => handleAssignmentChange(index, 'personName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Nombre de la persona"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview - EXACTO al diseño original */}
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
              
              {/* Flyer Preview - DISEÑO EXACTO */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-[#2c4875] to-[#3d5a80] px-8 py-6 flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-white text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {churchName}
                    </h1>
                    {subtitle && (
                      <p className="text-white/80 text-sm mt-1">{subtitle}</p>
                    )}
                  </div>
                  <div className="w-20 h-20 bg-white/15 border-2 border-white/30 rounded-xl flex items-center justify-center text-4xl">
                    🕊
                  </div>
                </div>

                {/* Gold Band */}
                <div className="h-1.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

                {/* Badge */}
                <div className="flex justify-center py-6">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-[#1B2D5B] px-8 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {worshipType}
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
                  Orden del Culto
                </div>

                {/* Assignments */}
                <div className="px-6 pb-6 space-y-2">
                  {assignments.map((assignment, index) => (
                    <div
                      key={index}
                      className={`flex items-center px-4 py-3 rounded-lg ${
                        index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-[#2c4875] text-amber-400 rounded-lg flex items-center justify-center text-xs font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="ml-4 flex-1 grid grid-cols-2 gap-4">
                        <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {assignment.roleName || 'Sin rol'}
                        </div>
                        <div className="text-sm font-semibold text-gray-800 italic text-right" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {assignment.person?.fullName || <span className="text-gray-400 not-italic text-xs">Sin asignar</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Verse */}
                {verse && (
                  <div className="text-center px-8 pb-4 text-xs italic text-gray-500" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {verse}
                  </div>
                )}

                {/* Footer */}
                <div className="bg-[#2c4875] py-4 text-center">
                  <div className="text-white/85 text-sm font-semibold uppercase tracking-wider" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {churchName}
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

export default ProgramEditPage;
