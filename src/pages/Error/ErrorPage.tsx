import { FunctionComponent } from 'react';
import { ErrorPageProps } from './ErrorPage.interface';

const ErrorPage: FunctionComponent<ErrorPageProps> = ({
  title = 'Oops! Well, this is embarassing...',
  message = 'Something terrible went wrong and we regret that you had to experience this! <b /> We are working to fix this.',
}: ErrorPageProps) => {
  return (
    <div>
      <h1 className="font-sans font-medium text-4xl text-center text-[#181818]">{title}</h1>
      <p className="font-sans font-medium text-base text-center text-[#181818] my-[0.1em]">{message}</p>
    </div>
  );
};

export default ErrorPage;
