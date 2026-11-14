import { FunctionComponent, ReactNode } from 'react';

type BlockquoteProps = {
    content: ReactNode;
}

const Blockquote: FunctionComponent<BlockquoteProps> = ({ content }) => {
  return (
    <div className="mt-12 p-6 rounded-2xl bg-muted border-l-4 border-accent">
      <p className="text-lg leading-relaxed italic text-foreground">{content}</p>
    </div>
  );
};

export default Blockquote;
