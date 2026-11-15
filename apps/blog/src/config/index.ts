import api from './api';
import env from './env';
import firebase from './firebase';
import sentry from './sentry';
import { readEnv } from './runtimeEnv';

const NAME = readEnv('VITE_APP_NAME') || 'Journal';
const TITLE = readEnv('VITE_APP_TITLE') || 'Journal';

export default {
  api,
  name: NAME,
  title: TITLE,
  env,
  firebase,
  sentry,
};
