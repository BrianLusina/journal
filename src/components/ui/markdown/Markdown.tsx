/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Components } from 'react-markdown';
import Blockquote from '../blockquote';

const MarkdownComponents: Partial<Components> = {
  h1(props) {
    const { node, ...rest } = props;
    return (
      <h1 className="text-5xl font-bold mb-2" {...rest} />
    );
  },
  h2(props) {
    const { node, ...rest } = props;
    return (
      <h2 className="text-3xl font-bold mb-4" {...rest} />
    );
  },
  h3(props) {
    const { node, ...rest } = props;
    return (
      <h3 className="text-3xl font-bold mb-2" {...rest} />
    );
  },
  p(props) {
    const { node, ...rest } = props;
    return (
      <div className="mb-10">
        <p className="text-lg leading-relaxed text-muted-foreground" {...rest} />
      </div>
    );
  },
  ul(props) {
    const { node, ...rest } = props;
    return <ul className="list-disc pl-6 space-y-2 text-muted-foreground" {...rest} />;
  },
  ol(props) {
    const { node, ...rest } = props;
    return <ol className="list-disc pl-6 space-y-2 text-muted-foreground" {...rest} />;
  },
  blockquote(props) {
    const { node, ...rest } = props;
    return <Blockquote content={rest.children as React.ReactNode} />;
  },
};

export default MarkdownComponents;
