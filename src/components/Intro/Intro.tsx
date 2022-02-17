import { FunctionComponent } from 'react';
import logo from '@assets/images/logo.jpg';
import config from '@config';
import { IntroProps } from './Intro.types';

const Intro: FunctionComponent<IntroProps> = ({ title, logoUrl, desc }) => (
  <section id="intro">
    <a href="/" className="logo">
      <img src={logoUrl || logo} alt={title || config.title} />
    </a>
    <header>
      <h2>{title || config.title}</h2>
      <p>{desc || `Journal of thoughts, musings, scatterthoughts, stories, and ideas.`}</p>
    </header>
  </section>
);

export default Intro;
