import { createElement } from 'react';
import ReactDOM from 'react-dom';

describe('test setup', () => {
  // Testing Library before v13 rendered this way, which runs React 18 as React 17.
  it.each(['render', 'hydrate'] as const)('fails a test that calls the legacy ReactDOM.%s', (api) => {
    expect(() => ReactDOM[api](createElement('div'), document.createElement('div'))).toThrow('legacy root');
  });
});
