import { FunctionComponent } from 'react';
import { BlurbProps } from './Blurb.types';

const Blurb: FunctionComponent<BlurbProps> = ({ title, content, children }) => {
  return (
    <section className="blurb">
      <h2>{title}</h2>
      <p>{content}</p>
      {children}
    </section>
  );
};

export default Blurb;
