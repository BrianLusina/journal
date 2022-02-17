import { FunctionComponent } from 'react';
import MenuItem from './MenuItem';
import { MenuProps } from './Menu.types';

const items = [
  {
    link: '/posts/',
    title: 'Posts',
    desc: 'Posts',
  },
  {
    link: '/authors/',
    title: 'Authors',
    desc: 'List of authors',
  },
];

const Menu: FunctionComponent<MenuProps> = ({ searchBar }) => {
  return (
    <section id="menu">
      <section>{searchBar && searchBar}</section>

      <section>
        <ul className="links">
          {items.map(({ link, title, desc }) => (
            <li key={title}>
              <MenuItem link={link} title={title} description={desc} />;
            </li>
          ))}
        </ul>
      </section>

      {/* <section>
        <ul className="actions stacked">
          <li>
            <a href="#" className="button large fit">
              Log In
            </a>
          </li>
        </ul>
      </section> */}
    </section>
  );
};

export default Menu;
