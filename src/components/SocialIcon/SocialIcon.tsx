import { FunctionComponent } from 'react';
import { SocialIconProps } from './SocialIcon.types';
import instagram from '@/assets/icons/instagram.svg';
import { Linkedin } from "lucide-react";


const SocialIcon: FunctionComponent<SocialIconProps> = ({ name, link, theme }) => {
  const resolveIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'instagram':
        return <img src={instagram} alt="Instagram" className="w-5 h-5" />;
      case 'linkedin':
        // TODO: Add LinkedIn icon here once a suitable SVG or component is available 
        return <Linkedin className="w-5 h-5" />
      default:
        // No icon for this account yet: show its name so the link isn't an empty circle.
        return <span className="text-xs font-medium">{name}</span>;
    }
  }
  
  const icon = resolveIcon(name);

  return (
    <a
      href={link}
      aria-label={name}
      className="w-12 h-12 rounded-full border-2 border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center hover:scale-110"
      target="_blank"
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
};

export default SocialIcon;
