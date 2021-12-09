import { FunctionComponent } from 'react';
import Intro from '../Intro';
import Footer from '../Footer/Footer';
import Contact from '../Contact/Contact';
import MiniPosts from '../MiniPost/MiniPosts';
import AboutBlurb from '../AboutBlurb/AboutBlurb';

const Sidebar: FunctionComponent = ({
  miniPosts,
  tag,
  about,
  socialLinks,
  pageDesc,
  contact: { town, country, email, emailAlias },
}) => (
  <section id="sidebar">
    <Intro />
    <MiniPosts posts={miniPosts} currentTag={tag} />
    <AboutBlurb about={about} />
    <Contact town={town} country={country} email={email} emailAlias={emailAlias} />
    <Footer socialLinks={socialLinks} />
  </section>
);

Sidebar.defaultProps = {
  pageDesc: null,
  tag: null,
};

Sidebar.propTypes = {
  miniPosts: arrayOf(object),
  about: string,
  contact: shape({
    town: string,
    country: string,
    email: string,
    emailAlias: string,
  }),
  socialLinks: arrayOf(
    shape({
      name: string,
      link: string,
    }),
  ),
  pageDesc: string,
  tag: string,
};

export default Sidebar;
