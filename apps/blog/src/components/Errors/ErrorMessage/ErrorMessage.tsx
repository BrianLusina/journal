import { FunctionComponent } from 'react';
import { ErrorPageProps } from './ErrorMessage.props';

const ErrorMessage: FunctionComponent<ErrorPageProps> = ({
  title = 'Oops! Well, this is embarrassing...',
  message = 'Something terrible went wrong and I feel terrible that you had to experience this! <b /> My little bots are working to fix this.',
}: ErrorPageProps) => {
  return (
    <div>
      <h1 className="font-sans font-medium text-4xl text-center text-[#181818]">{title}</h1>
      <p className="font-sans font-medium text-base text-center text-[#181818] my-[0.1em]">{message}</p>
    </div>
  );
};

export default ErrorMessage;
