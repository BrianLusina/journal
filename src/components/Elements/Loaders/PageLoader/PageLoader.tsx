import { ReactElement } from 'react';

export default function PageLoader(): ReactElement {
  return (
    <div
      className="fixed z-[999] h-8 w-8 overflow-visible m-auto inset-0 before:content-[''] before:block before:fixed before:inset-0 before:w-full before:h-full before:bg-[radial-gradient(rgba(20,20,20,0.8),rgba(0,0,0,0.8))] animate-spin"
    >
      <div className="h-4 w-4 -mt-2 rounded-full shadow-[rgba(255,255,255,0.75)_1.5em_0_0_0,rgba(255,255,255,0.75)_1.1em_1.1em_0_0,rgba(255,255,255,0.75)_0_1.5em_0_0,rgba(255,255,255,0.75)_-1.1em_1.1em_0_0,rgba(255,255,255,0.75)_-1.5em_0_0_0,rgba(255,255,255,0.75)_-1.1em_-1.1em_0_0,rgba(255,255,255,0.75)_0_-1.5em_0_0,rgba(255,255,255,0.75)_1.1em_-1.1em_0_0]" />
    </div>
  );
}
