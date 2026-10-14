import { createElement } from 'react';
import ReactDOM from 'react-dom';

describe('test setup', () => {
  it('fails a test that renders through the legacy ReactDOM.render root', () => {
    // Testing Library before v13 rendered this way, which runs React 18 as React 17.
    expect(() => ReactDOM.render(createElement('div'), document.createElement('div'))).toThrow(
      'ReactDOM.render is no longer supported',
    );
  });
});
