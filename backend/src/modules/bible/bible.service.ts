interface BibleVerse {
  reference: string;
  text: string;
  translation: string;
}

/**
 * Cache de versículos populares en español (RVR1960)
 * Para evitar depender de APIsexternas que no funcionan bien
 */
const POPULAR_VERSES_ES: Record<string, string> = {
  'matthew 28:19': 'Por tanto, id, y haced discípulos a todas las naciones, bautizándolos en el nombre del Padre, y del Hijo, y del Espíritu Santo',
  'matthew 28:20': 'enseñándoles que guarden todas las cosas que os he mandado; y he aquí yo estoy con vosotros todos los días, hasta el fin del mundo. Amén.',
  'john 3:16': 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
  'john 14:6': 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.',
  'psalm 23:1': 'Jehová es mi pastor; nada me faltará.',
  'psalms 23:1': 'Jehová es mi pastor; nada me faltará.',
  'romans 8:28': 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
  'philippians 4:13': 'Todo lo puedo en Cristo que me fortalece.',
  'jeremiah 29:11': 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
  'proverbs 3:5': 'Fíate de Jehová de todo tu corazón, Y no te apoyes en tu propia prudencia.',
  'proverbs 3:6': 'Reconócelo en todos tus caminos, Y él enderezará tus veredas.',
  'isaiah 40:31': 'pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán.',
  'matthew 11:28': 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.',
  '1 corinthians 13:4': 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece',
  '1 corinthians 13:13': 'Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.',
  'james 1:12': 'Bienaventurado el varón que soporta la tentación; porque cuando haya resistido la prueba, recibirá la corona de vida, que Dios ha prometido a los que le aman.',
  'joshua 1:9': 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas.',
  'psalm 46:1': 'Dios es nuestro amparo y fortaleza, Nuestro pronto auxilio en las tribulaciones.',
  'psalms 46:1': 'Dios es nuestro amparo y fortaleza, Nuestro pronto auxilio en las tribulaciones.',
  '1 timothy 4:12': 'Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.',
  '2 timothy 1:7': 'Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio.',
  'ephesians 6:10': 'Por lo demás, hermanos míos, fortaleceos en el Señor, y en el poder de su fuerza.',
  'colossians 3:23': 'Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres',
  'hebrews 11:1': 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.',
  'matthew 5:16': 'Así alumbre vuestra luz delante de los hombres, para que vean vuestras buenas obras, y glorifiquen a vuestro Padre que está en los cielos.',
  'matthew 28:12': 'Y reunidos con los ancianos, y habido consejo, dieron mucho dinero a los soldados',
  'acts 1:8': 'pero recibiréis poder, cuando haya venido sobre vosotros el Espíritu Santo, y me seréis testigos en Jerusalén, en toda Judea, en Samaria, y hasta lo último de la tierra.',
};

/**
 * Mapeo de nombres de libros bíblicos de español a inglés
 */
const BOOK_NAMES_ES_TO_EN: Record<string, string> = {
  // Antiguo Testamento
  'génesis': 'Genesis',
  'genesis': 'Genesis',
  'éxodo': 'Exodus',
  'exodo': 'Exodus',
  'levítico': 'Leviticus',
  'levitico': 'Leviticus',
  'números': 'Numbers',
  'numeros': 'Numbers',
  'deuteronomio': 'Deuteronomy',
  'josué': 'Joshua',
  'josue': 'Joshua',
  'jueces': 'Judges',
  'rut': 'Ruth',
  '1 samuel': '1 Samuel',
  '2 samuel': '2 Samuel',
  '1 reyes': '1 Kings',
  '2 reyes': '2 Kings',
  '1 crónicas': '1 Chronicles',
  '1 cronicas': '1 Chronicles',
  '2 crónicas': '2 Chronicles',
  '2 cronicas': '2 Chronicles',
  'esdras': 'Ezra',
  'nehemías': 'Nehemiah',
  'nehemias': 'Nehemiah',
  'ester': 'Esther',
  'job': 'Job',
  'salmos': 'Psalms',
  'salmo': 'Psalms',
  'proverbios': 'Proverbs',
  'eclesiastés': 'Ecclesiastes',
  'eclesiástes': 'Ecclesiastes',
  'ecclesiastes': 'Ecclesiastes',
  'cantares': 'Song of Solomon',
  'isaías': 'Isaiah',
  'isaias': 'Isaiah',
  'jeremías': 'Jeremiah',
  'jeremias': 'Jeremiah',
  'lamentaciones': 'Lamentations',
  'ezequiel': 'Ezekiel',
  'daniel': 'Daniel',
  'oseas': 'Hosea',
  'joel': 'Joel',
  'amós': 'Amos',
  'amos': 'Amos',
  'abdías': 'Obadiah',
  'abdias': 'Obadiah',
  'jonás': 'Jonah',
  'jonas': 'Jonah',
  'miqueas': 'Micah',
  'nahúm': 'Nahum',
  'nahum': 'Nahum',
  'habacuc': 'Habakkuk',
  'sofonías': 'Zephaniah',
  'sofonias': 'Zephaniah',
  'hageo': 'Haggai',
  'zacarías': 'Zechariah',
  'zacarias': 'Zechariah',
  'malaquías': 'Malachi',
  'malaquias': 'Malachi',
  
  // Nuevo Testamento
  'mateo': 'Matthew',
  'marcos': 'Mark',
  'lucas': 'Luke',
  'juan': 'John',
  'hechos': 'Acts',
  'romanos': 'Romans',
  '1 corintios': '1 Corinthians',
  '2 corintios': '2 Corinthians',
  'gálatas': 'Galatians',
  'galatas': 'Galatians',
  'efesios': 'Ephesians',
  'filipenses': 'Philippians',
  'colosenses': 'Colossians',
  '1 tesalonicenses': '1 Thessalonians',
  '2 tesalonicenses': '2 Thessalonians',
  '1 timoteo': '1 Timothy',
  '2 timoteo': '2 Timothy',
  'tito': 'Titus',
  'filemón': 'Philemon',
  'filemon': 'Philemon',
  'hebreos': 'Hebrews',
  'santiago': 'James',
  '1 pedro': '1 Peter',
  '2 pedro': '2 Peter',
  '1 juan': '1 John',
  '2 juan': '2 John',
  '3 juan': '3 John',
  'judas': 'Jude',
  'apocalipsis': 'Revelation',
};

/**
 * Traduce el nombre del libro bíblico de español a inglés
 */
function translateBookName(reference: string): string {
  const refTrimmed = reference.trim();
  const refLower = refTrimmed.toLowerCase();
  
  for (const [spanish, english] of Object.entries(BOOK_NAMES_ES_TO_EN)) {
    // Buscar coincidencia al inicio de la referencia
    const regex = new RegExp(`^${spanish}\\s+`, 'i');
    if (regex.test(refLower)) {
      // Hacer replace con case-insensitive en la referencia original
      const replaceRegex = new RegExp(`^${spanish}`, 'i');
      return refTrimmed.replace(replaceRegex, english);
    }
  }
  
  return refTrimmed;
}

/**
 * Normaliza la referencia bíblica para la API
 */
function normalizeReference(ref: string): string {
  return ref.trim().replace(/\s+/g, '+');
}

/**
 * Obtiene un versículo de la Biblia (español/inglés)
 */
export async function getBibleVerse(reference: string): Promise<BibleVerse | null> {
  try {
    const translatedRef = translateBookName(reference);
    const normalizedRef = normalizeReference(translatedRef);
    const cacheKey = normalizedRef.toLowerCase().replace(/\+/g, ' ');
    
    console.log('📖 Bible API Request:');
    console.log('   Original:', reference);
    console.log('   Translated:', translatedRef);
    console.log('   Normalized:', normalizedRef);
    console.log('   Cache key:', cacheKey);
    
    // 1. Buscar en cache de versículos populares en español
    if (POPULAR_VERSES_ES[cacheKey]) {
      console.log('✅ Verse found in Spanish cache');
      return {
        reference: reference.trim(),
        text: POPULAR_VERSES_ES[cacheKey],
        translation: 'RVR1960',
      };
    }
    
    // 2. Fallback a bible-api.com (inglés)
    const urlEnglish = `https://bible-api.com/${normalizedRef}`;
    console.log('   URL (EN):', urlEnglish);
    
    const response = await fetch(urlEnglish);
    
    if (!response.ok) {
      console.error('❌ Bible API error:', response.status, normalizedRef);
      return null;
    }
    
    const data: any = await response.json();
    
    const cleanText = data.text
      ?.trim()
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      || '';
    
    console.log('✅ Verse found (English fallback):', data.reference);
    console.log('💡 Tip: Agrega este versículo al cache español para mejor experiencia');
    
    return {
      reference: data.reference || translatedRef,
      text: cleanText,
      translation: data.translation_name || 'WEB (English)',
    };
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    return null;
  }
}

/**
 * Selecciona un versículo al azar del cache de versículos populares en español
 * @returns Objeto con referencia (español) y texto del versículo
 */
export function getRandomVerse(): { verse: string; verseText: string } {
  const entries = Object.entries(POPULAR_VERSES_ES);
  const randomIndex = Math.floor(Math.random() * entries.length);
  const [key, text] = entries[randomIndex];
  
  // Convertir la clave inglesa a español para la referencia
  const spanishRef = reverseTranslateReference(key);
  
  return {
    verse: spanishRef,
    verseText: text,
  };
}

/**
 * Convierte una referencia en inglés a español
 * Ejemplo: "matthew 28:19" → "Mateo 28:19"
 */
function reverseTranslateReference(englishRef: string): string {
  // Mapeo inverso de inglés a español
  const BOOK_NAMES_EN_TO_ES: Record<string, string> = {
    'genesis': 'Génesis',
    'exodus': 'Éxodo',
    'leviticus': 'Levítico',
    'numbers': 'Números',
    'deuteronomy': 'Deuteronomio',
    'joshua': 'Josué',
    'judges': 'Jueces',
    'ruth': 'Rut',
    '1 samuel': '1 Samuel',
    '2 samuel': '2 Samuel',
    '1 kings': '1 Reyes',
    '2 kings': '2 Reyes',
    '1 chronicles': '1 Crónicas',
    '2 chronicles': '2 Crónicas',
    'ezra': 'Esdras',
    'nehemiah': 'Nehemías',
    'esther': 'Ester',
    'job': 'Job',
    'psalm': 'Salmos',
    'psalms': 'Salmos',
    'proverbs': 'Proverbios',
    'ecclesiastes': 'Eclesiastés',
    'song of solomon': 'Cantares',
    'isaiah': 'Isaías',
    'jeremiah': 'Jeremías',
    'lamentations': 'Lamentaciones',
    'ezekiel': 'Ezequiel',
    'daniel': 'Daniel',
    'hosea': 'Oseas',
    'joel': 'Joel',
    'amos': 'Amós',
    'obadiah': 'Abdías',
    'jonah': 'Jonás',
    'micah': 'Miqueas',
    'nahum': 'Nahúm',
    'habakkuk': 'Habacuc',
    'zephaniah': 'Sofonías',
    'haggai': 'Hageo',
    'zechariah': 'Zacarías',
    'malachi': 'Malaquías',
    'matthew': 'Mateo',
    'mark': 'Marcos',
    'luke': 'Lucas',
    'john': 'Juan',
    'acts': 'Hechos',
    'romans': 'Romanos',
    '1 corinthians': '1 Corintios',
    '2 corinthians': '2 Corintios',
    'galatians': 'Gálatas',
    'ephesians': 'Efesios',
    'philippians': 'Filipenses',
    'colossians': 'Colosenses',
    '1 thessalonians': '1 Tesalonicenses',
    '2 thessalonians': '2 Tesalonicenses',
    '1 timothy': '1 Timoteo',
    '2 timothy': '2 Timoteo',
    'titus': 'Tito',
    'philemon': 'Filemón',
    'hebrews': 'Hebreos',
    'james': 'Santiago',
    '1 peter': '1 Pedro',
    '2 peter': '2 Pedro',
    '1 john': '1 Juan',
    '2 john': '2 Juan',
    '3 john': '3 Juan',
    'jude': 'Judas',
    'revelation': 'Apocalipsis',
  };
  
  // Extraer libro y referencia
  const match = englishRef.match(/^(.*?)(\d+:\d+)$/);
  if (!match) return englishRef;
  
  const bookName = match[1].trim().toLowerCase();
  const reference = match[2];
  
  const spanishBook = BOOK_NAMES_EN_TO_ES[bookName] || englishRef;
  return `${spanishBook} ${reference}`;
}
