import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { programsApi } from '../../lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const ProgramEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [program, setProgram] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    async function fetchProgram() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await programsApi.get(id);
        setProgram(res.data.data);
        setForm(res.data.data);
      } catch {
        toast.error('No se pudo cargar el programa');
        navigate('/programs');
      }
      setLoading(false);
    }
    fetchProgram();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await programsApi.update(id, form);
      toast.success('Programa actualizado');
      navigate('/programs');
    } catch {
      toast.error('Error al guardar');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!program) return null;

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-6 rounded-xl shadow">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-gray-500 hover:text-primary-600">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <h2 className="text-xl font-bold mb-4">Editar Programa</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre de la actividad</label>
          <input
            type="text"
            name="activityType.name"
            value={form.activityType?.name || ''}
            onChange={e => setForm({ ...form, activityType: { ...form.activityType, name: e.target.value } })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha</label>
          <input
            type="date"
            name="programDate"
            value={form.programDate ? form.programDate.slice(0,10) : ''}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {/* Puedes agregar más campos aquí según tu modelo */}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 btn btn-primary flex items-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
      </button>
    </div>
  );
};

export default ProgramEditPage;
