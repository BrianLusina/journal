import { FunctionComponent } from 'react';
import MainLayout from '@layouts/MainLayout';
import Pagination from '@components/Pagination';

const App: FunctionComponent = () => {
  return (
    <MainLayout>
      <section>
        {renderBlogPosts()}
        <Pagination />
      </section>
    </MainLayout>
  );
};

export default App;
