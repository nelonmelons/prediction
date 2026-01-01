"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface ChapterData {
  year: number;
  headline: string;
  narrative: string;
  visual_prompt: string;
}

interface TimelineSectionProps {
  chapter: ChapterData;
  index: number;
  totalChapters: number;
}

export default function TimelineSection({
  chapter,
  index,
  totalChapters,
}: TimelineSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20% 0px -20% 0px" });

  return (
    <motion.section
      ref={ref}
      className="min-h-screen flex items-center py-20"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0.3 }}
      transition={{ duration: 0.8 }}
    >
      <div className="w-full">
        {/* Year Badge */}
        <motion.div
          className="inline-block px-6 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }
          }
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-mono tracking-wider">
            {chapter.year}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {chapter.headline}
        </motion.h2>

        {/* Narrative */}
        <motion.div
          className="prose prose-invert prose-lg max-w-none"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-serif">
            {chapter.narrative}
          </p>
        </motion.div>

        {/* Visual Prompt Preview (hidden but available for Phase 4) */}
        <motion.div
          className="mt-8 text-xs text-gray-600 italic"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {/* Image prompt: {chapter.visual_prompt} */}
        </motion.div>

        {/* Progress Indicator */}
        {index < totalChapters - 1 && (
          <motion.div
            className="mt-16 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.5 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent"></div>
              <div className="text-xs text-gray-500">Continue</div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
