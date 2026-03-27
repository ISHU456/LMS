import { useEffect, useRef } from 'react';

const FluidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* 
        Removed dynamic canvas particles for performance. 
        Replacing with high-performance CSS gradients.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, rgba(67, 97, 238, 0.15), transparent 50%), radial-gradient(circle at 80% 30%, rgba(114, 9, 183, 0.12), transparent 45%), radial-gradient(circle at 50% 90%, rgba(247, 37, 133, 0.1), transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 bg-white dark:bg-[#030712] opacity-40 dark:opacity-60"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0) 40%, rgba(15,23,42,0.1))',
        }}
      />
    </div>
  );
};

export default FluidBackground;
