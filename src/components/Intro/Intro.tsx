import { FunctionComponent } from 'react';
import logo from '@assets/images/logo.jpg';
import { IntroProps } from './Intro.types';

const Intro: FunctionComponent<IntroProps> = ({ logoUrl, siteDesc }) => (
  <section id="intro">
    <a href="/" className="logo">
      <img src={logoUrl || logo} alt="LJournal" />
    </a>
    <header>
      <h2>LJournal</h2>
      <p>{siteDesc || `A simple journal by ${(<a href="https://github.com/BrianLusina">L</a>)}`}</p>
    </header>
  </section>
);

export default Intro;
