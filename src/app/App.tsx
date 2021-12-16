import { FunctionComponent } from 'react';
import MainLayout from '@layouts/MainLayout';
import Posts from '@features/Posts';

const App: FunctionComponent = () => {
  return (
    <MainLayout>
      <Posts />
    </MainLayout>
  );
};

export default App;
