import {useTranslation, initReactI18next} from 'react-i18next';
import i18next from 'i18next';
import {en} from './en';
import {fr} from './fr';

i18next.use(initReactI18next).init({
  resources: {
    en: {translation: en},
    fr: {translation: fr},
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
export {useTranslation};
