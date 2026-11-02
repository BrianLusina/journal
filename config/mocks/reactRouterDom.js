vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useHistory: () => ({
    push: vi.fn(),
  }),
}));
