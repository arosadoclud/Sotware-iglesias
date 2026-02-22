import { useEffect, useState } from 'react';
import { bibleStudiesApi } from '../../lib/api';
import { toast } from 'sonner';
import { Download, Calendar, BookOpen, FileText, Search, Filter, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

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
  fileSize?: number;
  downloadCount: number;
  thumbnailUrl?: string;
  createdAt: string;
}

export default function BibleStudiesPage() {
  const { user } = useAuthStore();
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);  
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [series, setSeries] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadStudies();
    loadSeries();
  }, [selectedYear, selectedMonth, selectedSeries, search]);

  const loadStudies = async () => {
    try {
      setLoading(true);
      const params: any = {
        year: selectedYear,
        isActive: 'true',
        sort: '-studyDate',
      };
      if (selectedMonth) params.month = selectedMonth;
      if (selectedSeries) params.series = selectedSeries;
      if (search) params.search = search;
      if (user?.churchId) params.church = user.churchId;

      const res = await bibleStudiesApi.getAll(params);
      setStudies(res.data.data || []);
    } catch (error) {
      console.error('Error loading studies:', error);
      toast.error('Error al cargar estudios bíblicos');
    } finally {
      setLoading(false);
    }
  };

  const loadSeries = async () => {
    try {
      const params: any = {};
      if (user?.churchId) params.church = user.churchId;
      const res = await bibleStudiesApi.getSeries(params);
      setSeries(res.data.data || []);
    } catch (error) {
      console.error('Error loading series:', error);
    }
  };

  const handleDownload = async (study: BibleStudy) => {
    try {
      // Track download
      await bibleStudiesApi.trackDownload(study._id);
      
      // Open PDF in new tab
      window.open(study.pdfUrl, '_blank');
      
      toast.success('Descargando estudio bíblico');
    } catch (error) {
      toast.error('Error al descargar');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const clearFilters = () => {
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(null);
    setSelectedSeries('');
    setSearch('');
  };

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <BookOpen className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Estudios Bíblicos</h1>
              <p className="text-blue-100 mt-1 text-sm md:text-base">Recursos para tu crecimiento espiritual</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, tema o maestro..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Filter className="w-5 h-5" />
              Filtros
              {(selectedMonth || selectedSeries) && (
                <span className="bg-amber-400 text-blue-900 px-2 py-0.5 rounded-full text-xs font-bold">
                  {(selectedMonth ? 1 : 0) + (selectedSeries ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>

              {/* Series */}
              {series.length > 0 && (                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
                  <select
                    value={selectedSeries}
                    onChange={(e) => setSelectedSeries(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas</option>
                    {series.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Studies Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : studies.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay estudios disponibles
            </h3>
            <p className="text-gray-500">
              {search || selectedMonth || selectedSeries
                ? 'Intenta ajustar los filtros'
                : 'Aún no se han publicado estudios bíblicos'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studies.map((study) => (
              <div
                key={study._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <Calendar className="w-6 h-6 text-amber-300 flex-shrink-0" />
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {formatDate(study.studyDate)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight">{study.title}</h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">{study.theme}</p>
                        {study.verse && (
                          <p className="text-sm text-gray-600 italic">"{study.verse}"</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {study.description}
                  </p>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {study.teacher && (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        👤 {study.teacher}
                      </span>
                    )}
                    {study.series && (
                      <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                        📚 {study.series}
                      </span>
                    )}
                    {study.fileSize && (
                      <span className="text-xs text-gray-500">
                        📄 {formatFileSize(study.fileSize)}
                      </span>
                    )}
                  </div>

                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(study)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 group-hover:scale-[1.02] shadow-md hover:shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Descargar PDF
                  </button>

                  {/* Stats */}
                  <div className="mt-3 text-center text-xs text-gray-500">
                    {study.downloadCount > 0 && `${study.downloadCount} descargas`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
