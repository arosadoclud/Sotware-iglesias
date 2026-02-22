import { useState, useEffect } from 'react';
import { BookOpen, Download, Calendar, ArrowRight } from 'lucide-react';
import { bibleStudiesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  downloadCount: number;
}

export default function BibleStudiesWidget() {
  const { user } = useAuthStore();
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentStudies();
  }, []);

  const loadRecentStudies = async () => {
    try {
      const params: any = {
        isActive: 'true',
        limit: 3,
        sort: '-studyDate',
      };
      if (user?.churchId) params.church = user.churchId;

      const res = await bibleStudiesApi.getAll(params);
      setStudies(res.data.data || []);
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (study: BibleStudy) => {
    try {
      await bibleStudiesApi.trackDownload(study._id);
      window.open(study.pdfUrl, '_blank');
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Estudios Bíblicos Recientes</h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (studies.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Estudios Bíblicos</h3>
            <p className="text-sm text-gray-600">Recursos recientes disponibles</p>
          </div>
        </div>
        <Link
          to="/estudios-biblicos"
          className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          Ver todos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {studies.map((study, index) => (
          <motion.div
            key={study._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-gray-200 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDate(study.studyDate)}
                  </span>
                  {study.downloadCount > 0 && (
                    <span className="text-xs text-gray-400">
                      • {study.downloadCount} descargas
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition truncate">
                  {study.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2 truncate">{study.theme}</p>
                {study.series && (
                  <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {study.series}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDownload(study)}
                className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                title="Descargar PDF"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Link
        to="/estudios-biblicos"
        className="mt-4 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
      >
        Ver todos los estudios
      </Link>
    </motion.div>
  );
}
