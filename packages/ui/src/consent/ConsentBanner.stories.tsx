import { Meta, StoryFn } from '@storybook/react';
import { ConsentBanner } from './ConsentBanner';

export default {
  title: 'Components/ConsentBanner',
  component: ConsentBanner,
  // Shown only while there is no saved choice; clear the consent cookie to see it again.
} as Meta<typeof ConsentBanner>;

export const Default: StoryFn<typeof ConsentBanner> = () => <ConsentBanner onGrant={() => undefined} />;
