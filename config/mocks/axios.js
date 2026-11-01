// const axiosMock = jest.genMockFromModule('axios');

// // this is the key to fix the axios.create() undefined error!
// axiosMock.create = vi.fn(() => axiosMock);
// axiosMock.interceptors = {
//   response: {
//     use: vi.fn(),
//   },
//   request: {
//     use: vi.fn(),
//   },
// };
// axiosMock.get = vi.fn();
// axiosMock.post = vi.fn();
// axiosMock.put = vi.fn();
// axiosMock.delete = vi.fn();
// axiosMock.default = {
//   get: vi.fn(),
//   post: vi.fn(),
//   put: vi.fn(),
//   delete: vi.fn(),
//   patch: vi.fn(),
// };

// export default axiosMock;

vi.mock('axios', () => {
  return {
    default: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
    create: () => {
      return {
        baseURL: 'https://test.eventsafrique.com',
        headers: {
          'Content-type': 'application/json',
        },
        defaults: {
          baseURL: 'https://test.eventsafrique.com',
        },
        interceptors: {
          response: {
            use: vi.fn(),
          },
          request: {
            use: vi.fn(),
          },
        },
        post: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        request: vi.fn(),
      };
    },
    post: {
      mockImplementationOnce: (callback) => {
        vi.fn(callback);
      },
    },
    get: {
      mockImplementationOnce: (callback) => {
        vi.fn(callback);
      },
    },
    put: {
      mockImplementationOnce: (callback) => {
        vi.fn(callback);
      },
    },
    delete: {
      mockImplementationOnce: (callback) => {
        vi.fn(callback);
      },
    },
    patch: {
      mockImplementationOnce: (callback) => {
        vi.fn(callback);
      },
    },
    request: vi.fn(),
  };
});
