import { FunctionComponent } from 'react';
import { ContactProps } from './Contact.types';

/**
 * Contact stateless component
 */
const Contact: FunctionComponent<ContactProps> = () => {
  return (
    <section>
      <header className="major">
        <h2>Get in touch</h2>
      </header>
      <p>
        Do get in touch to work on a project, create something new or even talk about the universe.
        :)
      </p>
      {/* <ul className="contact">
        <li className="fa fa-envelope-o">
          <a href={`mailto:${email}`}>{emailAlias}</a>
        </li>
        <li className="fa fa-home">
          {town}, {country}
          <br />
        </li>
      </ul> */}
    </section>
  );
};

export default Contact;
