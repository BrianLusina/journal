// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/vitest';
import ReactDOM from 'react-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

global.fetch = vi.fn();

// React 18 only warns when something renders through the legacy root, and the tree then runs as
// React 17 (no automatic batching or concurrent rendering). Fail instead. A plain assignment, not
// vi.spyOn, because `mockReset` would reset a spy to the real ReactDOM method before each test.
const legacyRoot = (api: string) => () => {
  throw new Error(`ReactDOM.${api} renders on the legacy root; use createRoot from react-dom/client.`);
};
Object.assign(ReactDOM, { render: legacyRoot('render'), hydrate: legacyRoot('hydrate') });
