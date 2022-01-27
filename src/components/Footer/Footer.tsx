import { FunctionComponent } from 'react';
import config from '@config';
import { FooterProps } from './Footer.types';

const Footer: FunctionComponent<FooterProps> = ({ title = config.title }) => (
  <section id="footer">
    <p className="copyright">
      &copy; {title}. All rights reserved.
      <br />
      Images <a href="https://unsplash.com">Unsplash</a>.
      <br />
    </p>
  </section>
);

export default Footer;
