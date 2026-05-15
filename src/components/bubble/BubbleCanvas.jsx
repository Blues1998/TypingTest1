import { forwardRef } from 'react'

export const BubbleCanvas = forwardRef(function BubbleCanvas({ width, height }, ref) {
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className="w-full max-w-4xl rounded-xl border border-[#2a2a2a]"
      style={{ aspectRatio: `${width}/${height}` }}
    />
  )
})
