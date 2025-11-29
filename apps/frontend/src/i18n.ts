import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import es from '../public/locales/es/translation.json';
import en from '../public/locales/en/translation.json';
import fr from '../public/locales/fr/translation.json';
import de from '../public/locales/de/translation.json';
import it from '../public/locales/it/translation.json';
import pt from '../public/locales/pt/translation.json';

// Lista de idiomas soportados
export const SUPPORTED_LANGUAGES = {
  es: { name: 'Español', flag: '🇪🇸' },
  en: { name: 'English', flag: '🇬🇧' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  it: { name: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Português', flag: '🇵🇹' },
};

i18n
  // Detectar idioma automáticamente
  .use(LanguageDetector)
  // Conectar con React
  .use(initReactI18next)
  // Inicializar configuración
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
    },
    // Idioma por defecto si no se detecta ninguno
    fallbackLng: 'es',

    // Configuración de detección automática
    detection: {
      // Orden de detección:
      // 1. localStorage (si usuario ya eligió manualmente)
      // 2. navigator (idioma del navegador)
      // 3. htmlTag (atributo lang del HTML)
      order: ['localStorage', 'navigator', 'htmlTag'],

      // Guardar idioma seleccionado en localStorage
      caches: ['localStorage'],

      // Key en localStorage
      lookupLocalStorage: 'i18nextLng',
    },

    // Interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },

    // Debug solo en desarrollo
    debug: import.meta.env.DEV,

    // Configuración adicional
    react: {
      useSuspense: false, // No usar Suspense para evitar flickers
    },
  });

// Log idioma detectado (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🌍 i18n inicializado');
  console.log('📍 Idioma detectado:', i18n.language);
  console.log('🗣️  Idiomas disponibles:', Object.keys(SUPPORTED_LANGUAGES));
}

export default i18n;
