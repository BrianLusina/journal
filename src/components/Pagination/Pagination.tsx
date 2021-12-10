import { FunctionComponent } from 'react';
import ButtonLink from '../Elements/ButtonLink';
import { PaginationProps } from './Pagination.types';

const Pagination: FunctionComponent<PaginationProps> = ({ previousUrl, nextUrl }) => {
  return (
    <ul className="actions pagination">
      <li>
        <ButtonLink
          path={previousUrl}
          text="Previous Page"
          className={`${previousUrl ? '' : 'disabled'} button large previous`}
        />
      </li>
      <li>
        <ButtonLink
          path={nextUrl || ''}
          text="Next Page"
          className={`${nextUrl ? '' : 'disabled'} button large next`}
        />
      </li>
    </ul>
  );
};

export default Pagination;
