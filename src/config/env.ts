// Vite only exposes MODE/DEV/PROD and VITE_-prefixed variables on import.meta.env.
const NODE_ENV = import.meta.env.MODE || 'development';
const ENV = import.meta.env.VITE_ENV || NODE_ENV;

export default {
    nodeEnv: NODE_ENV,
    env: ENV,
    debug: NODE_ENV === 'development' || NODE_ENV === 'test',
    isProduction: NODE_ENV === 'production',
  };
