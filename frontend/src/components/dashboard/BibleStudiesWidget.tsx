import { useState, useEffect } from 'react';
import { BookOpen, Download, Calendar, ArrowRight, Settings, User } from 'lucide-react';
import { bibleStudiesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { P } from '../../constants/permissions';

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
  thumbnailUrl?: string;
  fileSize?: number;
  downloadCount: number;
}

export default function BibleStudiesWidget() {
  const { user, hasPermission } = useAuthStore();
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
      
      // Download PDF with proper filename
      const link = document.createElement('a');
      link.href = study.pdfUrl;
      link.download = `${study.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      className="bg-white rounded-xl shadow-md border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Estudios Bíblicos</h3>
            <p className="text-xs text-gray-500">Guías de estudio disponibles para descargar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(P.BIBLE_STUDIES_CREATE) && (
            <Link
              to="/estudios-biblicos/admin"
              className="text-gray-400 hover:text-blue-600 transition p-1.5 hover:bg-blue-50 rounded-lg"
              title="Administrar estudios"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
          <Link
            to="/estudios-biblicos"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Ver todos
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {studies.map((study, index) => (
          <motion.div
            key={study._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex flex-col"
          >
            {/* Card Image / Placeholder */}
            <div className="relative w-full aspect-video overflow-hidden">
              {study.thumbnailUrl ? (
                <img
                  src={study.thumbnailUrl}
                  alt={study.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                  index === 0
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    : index === 1
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                }`}>
                  <BookOpen className="w-10 h-10 text-white/80 mb-2" />
                  <p className="text-white/90 text-xs font-semibold text-center line-clamp-2 leading-tight">
                    {study.theme}
                  </p>
                </div>
              )}
              {/* Series badge */}
              {study.series && (
                <span className="absolute top-2 left-2 text-xs bg-white/90 text-purple-700 font-semibold px-2 py-0.5 rounded-full shadow-sm">
                  {study.series}
                </span>
              )}
            </div>

            {/* Card Content */}
            <div className="flex flex-col flex-1 p-4">
              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(study.studyDate)}</span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
                {study.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-3">
                {study.description}
              </p>

              {/* Teacher */}
              {study.teacher && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                  <User className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{study.teacher}</span>
                </div>
              )}

              {/* Download Button */}
              <button
                onClick={() => handleDownload(study)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Guía PDF
                {study.downloadCount > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {study.downloadCount}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
