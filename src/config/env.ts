const NODE_ENV = import.meta.env.NODE_ENV || 'development';
const ENV = import.meta.env.ENV || 'development';

export default {
    nodeEnv: NODE_ENV,
    env: ENV,
    debug: NODE_ENV === 'development' || NODE_ENV === 'test',
    isProduction: NODE_ENV === 'production',
  };
  