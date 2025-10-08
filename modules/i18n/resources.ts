import ar from '@/translations/ar.json';
import bn from '@/translations/bn.json';
import en from '@/translations/en.json';
import es from '@/translations/es.json';
import fr from '@/translations/fr.json';
import hi from '@/translations/hi.json';
import id from '@/translations/id.json';
import pt from '@/translations/pt.json';
import ru from '@/translations/ru.json';
import zh from '@/translations/zh.json';

export const resources = {
  en: {
    translation: en,
  },
  id: {
    translation: id,
  },
  ar: {
    translation: ar,
  },
  bn: {
    translation: bn,
  },
  zh: {
    translation: zh,
  },
  fr: {
    translation: fr,
  },
  hi: {
    translation: hi,
  },
  pt: {
    translation: pt,
  },
  ru: {
    translation: ru,
  },
  es: {
    translation: es,
  },
};

export type Language = keyof typeof resources;
