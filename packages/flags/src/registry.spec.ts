import { defineFlags } from './registry';

describe('defineFlags', () => {
  it('keeps the definitions as given', () => {
    const flags = defineFlags({ analytics: { default: false, description: 'GA4 behind consent', sites: ['home', 'folio'] } });

    expect(flags.analytics).toEqual({ default: false, description: 'GA4 behind consent', sites: ['home', 'folio'] });
  });

  it('types its keys as the flag names', () => {
    const flags = defineFlags({ a: { default: true, description: 'A', sites: ['blog'] } });
    const name: keyof typeof flags = 'a';

    expect(Object.keys(flags)).toEqual([name]);
  });
});
