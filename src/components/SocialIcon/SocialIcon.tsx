import { FunctionComponent } from 'react';
import { SocialIconProps } from './SocialIcon.types';

const SocialIcon: FunctionComponent<SocialIconProps> = ({ name, link, icon }) => {
  return (
    <a href={link} className={`icon fa-${icon}`} target="_blank" rel="noopener noreferrer">
      <span className="label">{name}</span>
    </a>
  );
};

export default SocialIcon;
