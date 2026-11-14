import { FunctionComponent } from 'react';
import SocialIcon from '../SocialIcon';
import { SocialCardProps } from './SocialCard.types';

const SocialCard: FunctionComponent<SocialCardProps> = ({ items }) => (
  <div id="social-card" className="flex gap-4 items-center" style={{ listStyleType: 'none' }}>
    {items.map(({ link, name, theme }) => {
      return (
        <li key={name}>
          <SocialIcon link={link} name={name} theme={theme} />
        </li>
      );
    })}
  </div>
);

export default SocialCard;
