import { ABOUT_PAGE_ROUTE, ARTICLES_PAGE_ROUTE, CONTACT_PAGE_ROUTE, HOME_PAGE_ROUTE } from '@/routes/links';

const navbarItems = [
  {
    name: 'Home',
    path: HOME_PAGE_ROUTE,
  },
  {
    name: 'Articles',
    path: ARTICLES_PAGE_ROUTE,
  },
  {
    name: 'About',
    path: ABOUT_PAGE_ROUTE,
  },
  {
    name: 'Contact',
    path: CONTACT_PAGE_ROUTE,
  },
];

export default navbarItems;
