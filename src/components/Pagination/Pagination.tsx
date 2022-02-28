import { FunctionComponent } from 'react';
import Button from '@components/Elements/Button';
import { PaginationProps } from './Pagination.types';

const Pagination: FunctionComponent<PaginationProps> = ({
  hasNextPage,
  onClick,
  text = 'More',
}) => {
  return (
    <ul className="actions pagination">
      <li>
        <Button onClick={onClick} className="next" disabled={!hasNextPage}>
          {text}
        </Button>
      </li>
    </ul>
  );
};

export default Pagination;
