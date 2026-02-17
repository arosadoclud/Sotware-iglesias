/**
 * Servicio para consultar versículos bíblicos a través del backend
 */

import { api } from './api';

interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

/**
 * Obtiene el texto de un versículo bíblico desde el backend
 * @param reference Referencia bíblica (ej: "Mateo 28:12", "Juan 3:16")
 * @param translation Traducción (rvr1960, nvi, default: rvr1960)
 */
export async function getVerseText(
  reference: string,
  translation: string = 'rvr1960'
): Promise<BibleVerse | null> {
  try {
    // Llamar al backend que actúa como proxy para evitar CORS
    const encodedRef = encodeURIComponent(reference.trim());
    
    console.log('🔍 Buscando versículo:', reference.trim());
    console.log('📡 URL:', `/bible/verse/${encodedRef}`);
    
    const response = await api.get(`/bible/verse/${encodedRef}`);
    
    if (response.data.success && response.data.data) {
      console.log('✅ Versículo encontrado:', response.data.data);
      return response.data.data as BibleVerse;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Error fetching Bible verse:', error);
    
    if (error.response?.status === 404) {
      console.error('⚠️ Versículo no encontrado:', reference);
      console.error('Mensaje del servidor:', error.response?.data?.message);
    }
    
    return null;
  }
}

/**
 * Extrae la referencia bíblica de un texto que puede contener el versículo completo
 * Ejemplo: '"Por tanto..." - Mateo 28:19' -> 'Mateo 28:19'
 */
export function extractReference(text: string): string | null {
  // Patrones comunes de referencias bíblicas
  const patterns = [
    /([1-3]?\s*[A-Za-záéíóúñÑ]+)\s+(\d+):(\d+(-\d+)?)/,  // Mateo 28:19, 1 Juan 3:16
    /([1-3]?\s*[A-Za-záéíóúñÑ]+)\s+(\d+)\s*[:.,]\s*(\d+(-\d+)?)/,  // Variaciones con puntuación
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return null;
}
