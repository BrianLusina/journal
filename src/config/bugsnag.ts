const BUGSNAG_API_KEY = import.meta.env.VITE_BUGSNAG_API_KEY || '';

export default {
  apiKey: BUGSNAG_API_KEY || '',
};
  