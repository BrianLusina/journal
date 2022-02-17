import { FunctionComponent } from 'react';
import SocialIcon from '../SocialIcon';
import { SocialCardProps } from './SocialCard.types';

const SocialCard: FunctionComponent<SocialCardProps> = ({ items }) => (
  <section id="footer">
    <ul className="icons">
      {items.map(({ link, name, icon }) => {
        return (
          <li key={name}>
            <SocialIcon icon={icon} link={link} name={name} />
          </li>
        );
      })}
    </ul>
  </section>
);

export default SocialCard;
