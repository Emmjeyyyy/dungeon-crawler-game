
import React, { forwardRef } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

const GameCanvas = forwardRef<HTMLCanvasElement>((props, ref) => {
  return (
    <canvas
      ref={ref}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="max-w-full max-h-screen aspect-video border-4 border-slate-800 rounded-lg shadow-2xl bg-black cursor-crosshair [image-rendering:pixelated]"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

export default GameCanvas;
