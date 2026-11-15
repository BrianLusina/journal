// The server-only entry: content sources that hold CMS credentials and query the CMSs directly.
// Never import this from browser code; use the root entry there.
export { contentfulSource } from './src/contentful/source';
export { isContentfulConfigured } from './src/contentful/client';
