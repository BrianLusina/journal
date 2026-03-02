import { FunctionComponent, LazyExoticComponent, lazy } from 'react';
import {
  ABOUT_PAGE_ROUTE,
  ABOUT_US_PAGE_ROUTE,
  ARTICLE_DETAIL_PAGE_ROUTE,
  ARTICLE_PAGE_BY_TAG_ROUTE,
  ARTICLE_PAGE_ROUTE,
  ARTICLES_DETAIL_PAGE_ROUTE,
  ARTICLES_PAGE_ROUTE,
  AUTHORS_PAGE_ROUTE,
  BASE_ROUTE,
  CONTACT_PAGE_ROUTE,
  CONTACT_US_PAGE_ROUTE,
  HOME_PAGE_ROUTE,
  PRIVACY_PAGE_ROUTE,
  TERMS_PAGE_ROUTE,
} from './links';

export type RouteType = {
  path: string;
  alternatePaths: string[];
  component: LazyExoticComponent<FunctionComponent<object>>;
};

// Lazy load route components

// Home page
const HomePage = lazy(() => import('@/pages/Home'));

// Contact page
const ContactPage = lazy(() => import('@/pages/Contact'));

// About page
const AboutPage = lazy(() => import('@/pages/About'));

// Article pages
const ArticlePage = lazy(() => import('@/pages/Article'));
const ArticlesPage = lazy(() => import('@/pages/Article/ArticlesPage'));
const ArticlesByTagPage = lazy(() => import('@/pages/Article/ArticlesByTagPage'));

// Privacy and Terms pages
const PrivacyPage = lazy(() => import('@/pages/Privacy'));
const TermsPage = lazy(() => import('@/pages/Terms'));

// Authors page
const AuthorsPage = lazy(() => import('@/pages/Authors'));

const Posts = lazy(() => import('@/features/Posts'));

export default [
  {
    path: HOME_PAGE_ROUTE,
    alternatePaths: [BASE_ROUTE],
    component: HomePage,
  },
  {
    path: CONTACT_US_PAGE_ROUTE,
    alternatePaths: [CONTACT_PAGE_ROUTE],
    component: ContactPage,
  },
  {
    path: ABOUT_PAGE_ROUTE,
    alternatePaths: [ABOUT_US_PAGE_ROUTE],
    component: AboutPage,
  },
  {
    path: ARTICLES_PAGE_ROUTE,
    alternatePaths: [ARTICLE_PAGE_ROUTE],
    component: ArticlesPage,
  },
  {
    path: ARTICLE_DETAIL_PAGE_ROUTE,
    alternatePaths: [ARTICLES_DETAIL_PAGE_ROUTE],
    component: ArticlePage,
  },
  {
    path: ARTICLE_PAGE_BY_TAG_ROUTE,
    alternatePaths: [ARTICLE_PAGE_BY_TAG_ROUTE],
    component: ArticlesByTagPage,
  },
  {
    path: TERMS_PAGE_ROUTE,
    alternatePaths: [],
    component: TermsPage,
  },
  {
    path: PRIVACY_PAGE_ROUTE,
    alternatePaths: [],
    component: PrivacyPage,
  },
  {
    path: AUTHORS_PAGE_ROUTE,
    alternatePaths: [],
    component: AuthorsPage,
  },
] satisfies RouteType[];
