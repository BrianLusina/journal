import config from '@config';


const Logo = ({ name = config.title }) => (
  <div className="flex items-center min-w-0">
    <a href="/" className="flex items-center gap-1.5 sm:gap-2">
      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-primary-foreground font-bold text-base sm:text-lg">{name.charAt(0)}</span>
      </div>
      <span className="text-base sm:text-xl font-bold font-serif truncate">{name}</span>
    </a>
  </div>
);

export default Logo;
