import React from 'react';
import { shallow, mount } from 'enzyme';
import Intro from './Intro';

describe('Intro', () => {
  let wrapper;

  const props = {
    pageDesc: 'Page description',
  };

  beforeEach(() => {
    wrapper = shallow(<Intro {...props} />);
  });

  it('should be able to mount', () => {
    mount(<Intro {...props} />);
  });

  it('should have one section element with id attribute of intro', () => {
    const section = wrapper.find('section');

    expect(section.length).toEqual(1);
    expect(section.props().id).toEqual('intro');
  });

  it('should have one header element with', () => {
    const header = wrapper.find('header');

    expect(header.length).toEqual(1);
  });

  it('should have 1 h2 element with the title of the site LJournal', () => {
    const h2 = wrapper.find('h2');

    expect(h2.length).toEqual(1);
    expect(h2.text()).toEqual('LJournal');
  });

  it('should have 1 p tag', () => {
    const p = wrapper.find('p');

    expect(p.length).toEqual(1);
    expect(p.text()).toEqual(props.pageDesc);
  });
});
