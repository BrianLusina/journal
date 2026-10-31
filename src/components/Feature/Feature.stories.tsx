import { Meta, StoryFn } from '@storybook/react';
import { FEATURE_DEFAULTS } from '@/config/features';
import FeaturesProvider from '@/providers/features';
import Feature from './Feature';

export default {
  title: 'Components/Feature',
  component: Feature,
} as Meta<typeof Feature>;

const Template =
  (enabled: boolean): StoryFn<typeof Feature> =>
  args => (
    <FeaturesProvider value={{ ...FEATURE_DEFAULTS, [args.name]: enabled }}>
      <Feature {...args} />
    </FeaturesProvider>
  );

const args = {
  name: 'search' as const,
  fallback: <p>Shown while the feature is off.</p>,
  children: <p>Shown while the feature is on.</p>,
};

export const On = Template(true).bind({});
On.args = args;

export const Off = Template(false).bind({});
Off.args = args;
