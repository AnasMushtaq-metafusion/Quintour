import { BackendModule } from 'i18next';
import { BASE_URL } from '../Utils/variable';

const CustomBackend: BackendModule = {
  type: 'backend',
  init: () => {},

  read: async (language, namespace, callback) => {
    try {
      const response = await fetch(`https://api3.quinbook.com/v1/resources/${language}/qtapp/${namespace}`);
      if (!response.ok) {
        throw new Error(`Failed to load ${language}/${namespace}`);
      }
      const data = await response.json();


      callback(null, data);
    } catch (err) {
      console.error('Error loading translation:', err);
      callback(null, {}); // fallback empty
    }
  },
};

export default CustomBackend;
