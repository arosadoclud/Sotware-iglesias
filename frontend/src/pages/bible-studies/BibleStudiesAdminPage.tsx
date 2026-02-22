import { useState, useEffect } from 'react';
import { bibleStudiesApi } from '../../lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { 
  Plus, Edit2, Trash2, Upload, X, Save, Calendar,
  BookOpen, FileText, Loader2, Download, Image
} from 'lucide-react';

interface BibleStudy {
  _id: string;
  title: string;
  studyDate: string;
  theme: string;
  verse?: string;
  description: string;
  teacher?: string;
  series?: string;
  pdfUrl: string;
  pdfPublicId?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

interface FormData {
  title: string;
  studyDate: string;
  theme: string;
  verse: string;
  description: string;
  teacher: string;
  series: string;
  pdfUrl: string;
  pdfPublicId: string;
  fileSize: number;
  thumbnailUrl: string;
  thumbnailPublicId: string;
}

const INITIAL_FORM: FormData = {
  title: '',
  studyDate: '',
  theme: '',
  verse: '',
  description: '',
  teacher: '',
  series: '',
  pdfUrl: '',
  pdfPublicId: '',
  fileSize: 0,
  thumbnailUrl: '',
  thumbnailPublicId: '',
};

export default function BibleStudiesAdminPage() {
  const { user } = useAuthStore();
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const params: any = { isActive: 'all', sort: '-studyDate' };
      if (user?.churchId) params.church = user.churchId;
      const res = await bibleStudiesApi.getAll(params);
      setStudies(res.data.data || []);
    } catch (error) {
      console.error('Error loading studies:', error);
      toast.error('Error al cargar estudios');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande (máximo 5MB)');
      return;
    }

    try {
      setUploadingImage(true);
      const res = await bibleStudiesApi.uploadImage(file);
      const { url, publicId } = res.data.data;
      setFormData((prev) => ({ ...prev, thumbnailUrl: url, thumbnailPublicId: publicId }));
      toast.success('Imagen subida correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('El archivo es muy grande (máximo 20MB)');
      return;
    }

    try {
      setUploading(true);
      const res = await bibleStudiesApi.uploadPdf(file);
      const { url, publicId, fileSize } = res.data.data;

      setFormData((prev) => ({
        ...prev,
        pdfUrl: url,
        pdfPublicId: publicId,
        fileSize: fileSize,
      }));

      toast.success('PDF subido correctamente');
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      toast.error(error.response?.data?.message || 'Error al subir PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.studyDate || !formData.theme || !formData.description || !formData.pdfUrl) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await bibleStudiesApi.update(editingId, formData);
        toast.success('Estudio actualizado');
      } else {
        await bibleStudiesApi.create(formData);
        toast.success('Estudio creado');
      }
      loadStudies();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving study:', error);
      toast.error(error.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este estudio?')) return;

    try {
      await bibleStudiesApi.delete(id);
      toast.success('Estudio eliminado');
      loadStudies();
    } catch (error: any) {
      console.error('Error deleting study:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleOpenModal = (study?: BibleStudy) => {
    if (study) {
      setEditingId(study._id);
      setFormData({
        title: study.title,
        studyDate: study.studyDate.split('T')[0],
        theme: study.theme,
        verse: study.verse || '',
        description: study.description,
        teacher: study.teacher || '',
        series: study.series || '',
        pdfUrl: study.pdfUrl,
        pdfPublicId: study.pdfPublicId || '',
        fileSize: study.fileSize || 0,
        thumbnailUrl: study.thumbnailUrl || '',
        thumbnailPublicId: study.thumbnailPublicId || '',
      });
    } else {
      setEditingId(null);
      setFormData(INITIAL_FORM);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Administrar Estudios Bíblicos
          </h1>
          <p className="text-gray-600 mt-2">Gestiona los recursos disponibles para la congregación</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nuevo Estudio
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : studies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No hay estudios bíblicos aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 border-b-2 border-blue-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Título</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Tema</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Serie</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Maestro</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Descargas</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studies.map((study) => (
                  <tr key={study._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(study.studyDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{study.title}</div>
                      {study.verse && (
                        <div className="text-xs text-gray-500 italic">{study.verse}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{study.theme}</td>
                    <td className="px-6 py-4 text-sm">
                      {study.series ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                          {study.series}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {study.teacher || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Download className="w-4 h-4" />
                        {study.downloadCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(study.pdfUrl, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Ver PDF"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(study)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(study._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Estudio' : 'Nuevo Estudio Bíblico'}
              </h2>
              <button onClick={handleCloseModal} className="hover:bg-blue-600 p-2 rounded transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Título del Estudio *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: La Fe que Mueve Montañas"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha del Martes *
                </label>
                <input
                  type="date"
                  value={formData.studyDate}
                  onChange={(e) => setFormData({ ...formData, studyDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Theme & Verse */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tema / Versículo Clave *
                  </label>
                  <input
                    type="text"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hebreos 11:1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Texto del Versículo
                  </label>
                  <input
                    type="text"
                    value={formData.verse}
                    onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="La fe es la certeza..."
                  />
                </div>
              </div>

              {/* Teacher & Series */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maestro / Predicador
                  </label>
                  <input
                    type="text"
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del maestro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Serie
                  </label>
                  <input
                    type="text"
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre de la serie (opcional)"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Breve descripción del contenido del estudio..."
                />
              </div>

              {/* Thumbnail Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Imagen de Portada <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                  {formData.thumbnailUrl ? (
                    <div className="relative">
                      <img
                        src={formData.thumbnailUrl}
                        alt="Portada"
                        className="w-full h-40 object-cover"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, thumbnailUrl: '', thumbnailPublicId: '' })}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full hover:bg-red-700 shadow-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center p-6 hover:bg-gray-50 transition">
                      <Image className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {uploadingImage ? 'Subiendo imagen...' : 'Subir imagen de portada'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">JPG, PNG o WebP · Máx. 5MB</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleUploadImage}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Archivo PDF *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {formData.pdfUrl ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-red-500" />
                        <div>
                          <p className="font-medium text-gray-900">PDF subido correctamente</p>
                          <p className="text-sm text-gray-500">{formatFileSize(formData.fileSize)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, pdfUrl: '', pdfPublicId: '', fileSize: 0 })}
                        className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {uploading ? 'Subiendo...' : 'Haz clic para subir PDF'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">Máximo 20MB</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleUploadPdf}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading || !formData.pdfUrl}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {editingId ? 'Actualizar' : 'Guardar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
