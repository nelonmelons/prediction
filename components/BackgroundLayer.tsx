"use client";

import { motion, MotionValue, useTransform } from "framer-motion";

interface BackgroundLayerProps {
  chapter: {
    year: number;
  };
  index: number;
  totalChapters: number;
  scrollYProgress: MotionValue<number>;
}

export default function BackgroundLayer({
  chapter,
  index,
  totalChapters,
  scrollYProgress,
}: BackgroundLayerProps) {
  // Calculate opacity based on scroll progress
  const chapterProgress = useTransform(
    scrollYProgress,
    [
      Math.max(0, (index - 0.5) / totalChapters),
      index / totalChapters,
      (index + 0.5) / totalChapters,
      Math.min(1, (index + 1) / totalChapters),
    ],
    [0, 1, 1, 0]
  );

  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black"
      style={{ opacity: chapterProgress }}
    >
      {/* Placeholder for generated images - will add in Phase 4 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="text-9xl font-bold text-white/10">{chapter.year}</div>
      </div>
    </motion.div>
  );
}
