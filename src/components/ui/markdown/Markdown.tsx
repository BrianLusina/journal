/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Components } from 'react-markdown';
import Blockquote from '../blockquote';

const MarkdownComponents: Partial<Components> = {
  h1(props) {
    const { node, ...rest } = props;
    return (
      // @ts-ignore
      <h1 className="text-5xl font-bold mb-2">{...rest}</h1>
    );
  },
  h2(props) {
    const { node, ...rest } = props;
    return (
      // @ts-ignore
      <h2 className="text-3xl font-bold mb-4">{...rest.children}</h2>
    );
  },
  h3(props) {
    const { node, ...rest } = props;
    return (
      // @ts-ignore
      <h3 className="text-3xl font-bold mb-2">{...rest.children}</h3>
    );
  },
  p(props) {
    const { node, ...rest } = props;
    return (
      <div className="mb-10">
        {/* @ts-ignore */}
        <p className="text-lg leading-relaxed text-muted-foreground">{...rest.children}</p>
      </div>
    );
  },
  ul(props) {
    const { node, ...rest } = props;
    // @ts-ignore
    return <ul className="list-disc pl-6 space-y-2 text-muted-foreground">{...rest.children}</ul>;
  },
  ol(props) {
    const { node, ...rest } = props;
    // @ts-ignore
    return <ol className="list-disc pl-6 space-y-2 text-muted-foreground">{...rest.children}</ol>;
  },
  blockquote(props) {
    const { node, ...rest } = props;
    return <Blockquote content={rest.children} />
  },
};

export default MarkdownComponents;
