// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import ReactDOM from 'react-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

global.fetch = jest.fn();

// React 18 only warns when something renders through the legacy root, and the tree then runs as
// React 17 (no automatic batching or concurrent rendering). Fail instead. A plain assignment, not
// jest.spyOn, because `resetMocks` would reset a spy to a silent no-op before each test.
const legacyRoot = (api: string) => () => {
  throw new Error(`ReactDOM.${api} renders on the legacy root; use createRoot from react-dom/client.`);
};
Object.assign(ReactDOM, { render: legacyRoot('render'), hydrate: legacyRoot('hydrate') });
