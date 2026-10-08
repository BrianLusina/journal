import api from './api';
import env from './env';
import firebase from './firebase';
import sentry from './sentry';

const NAME = import.meta.env.VITE_APP_NAME || 'Journal';
const TITLE = import.meta.env.VITE_APP_TITLE || 'Journal';

export default {
  api,
  name: NAME,
  title: TITLE,
  env,
  firebase,
  sentry,
};
