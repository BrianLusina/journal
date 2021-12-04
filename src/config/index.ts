import api from './api';
import env from './env';
import firebase from './firebase';
import sentry from './sentry';
import bugsnag from './bugsnag';

export default {
  api,
  name: process.env.NAME || 'LJournal',
  title: process.env.TITLE || 'LJournal',
  env,
  firebase,
  sentry,
  bugsnag,
};
