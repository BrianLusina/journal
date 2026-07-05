import { FunctionComponent } from 'react';
import config from '@config';
import { IntroSectionProps } from './IntroSection.types';

const IntroSection: FunctionComponent<IntroSectionProps> = ({ title, desc }) => {
  return (
    <section className="max-w-4xl mx-auto py-12 md:py-16 px-4 animate-fade-in">
      <div className="text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight animate-slide-up">
          {title || config.title} is a space for exploring ideas, finding inspiration, and discovering new ways of seeing the world.
        </h2>
        {/* TODO: populate from a config or from an API */}
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto animate-slide-up stagger-1">
          {desc ||
            `From mindful living and personal growth to travel experiences and creative pursuits, 
          we share perspectives that enrich daily life. Join us as we explore topics that inspire 
          curiosity and meaningful conversation.`}
        </p>
      </div>
    </section>
  );
};

export default IntroSection;

