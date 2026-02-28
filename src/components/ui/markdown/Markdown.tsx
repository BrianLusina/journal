/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Components } from 'react-markdown';

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
  //   ul(props) {
  //     const { node, ...rest } = props;
  //     // @ts-ignore
  //     return <UnorderedTextList {...rest} />;
  //   },
  //   ol(props) {
  //     const { node, ...rest } = props;
  //     // @ts-ignore
  //     return <OrderedTextList {...rest} />;
  //   },
};

export default MarkdownComponents;
