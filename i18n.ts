import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import 'intl-pluralrules'; // Ensure plural rules are polyfilled


import RNLanguageDetector from '@os-team/i18next-react-native-language-detector';
import CustomBackend from './src/Snipets/i18nexpressBackend';

i18n
  .use(CustomBackend) // Load from API
  .use(RNLanguageDetector) // Detect & persist language in AsyncStorage
  .use(initReactI18next) // Bind to react-i18next
  .init({
    supportedLngs: ['en', 'de'],
    fallbackLng: 'en',
    ns: [],   // add login
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    react: { useSuspense: false }, // RN usually needs false
  });


export default i18n;
