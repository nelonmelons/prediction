"use client";

import { motion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import TimelineSection from "@/components/TimelineSection";
import BackgroundLayer from "@/components/BackgroundLayer";

interface ChapterData {
  year: number;
  headline: string;
  narrative: string;
  visual_prompt: string;
}

interface TimelineData {
  generated_at: string;
  bias: string;
  chapters: ChapterData[];
}

export default function HistoryBook() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Load timeline data
  useEffect(() => {
    fetch("/timeline.json")
      .then((res) => res.json())
      .then((data) => {
        setTimelineData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading timeline:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔮</div>
          <div className="text-2xl font-serif">Loading the future...</div>
        </div>
      </div>
    );
  }

  if (!timelineData || !timelineData.chapters.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center max-w-lg px-4">
          <div className="text-6xl mb-4">📖</div>
          <h1 className="text-3xl font-serif mb-4">No Timeline Generated</h1>
          <p className="text-gray-400 mb-6">
            Run{" "}
            <code className="bg-gray-800 px-2 py-1 rounded">
              npm run generate
            </code>{" "}
            to create your timeline first.
          </p>
        </div>
      </div>
    );
  }

  const chapters = timelineData.chapters;

  return (
    <div ref={containerRef} className="relative">
      {/* Fixed Background Layer */}
      <div className="fixed inset-0 z-0">
        {chapters.map((chapter, index) => (
          <BackgroundLayer
            key={chapter.year}
            chapter={chapter}
            index={index}
            totalChapters={chapters.length}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>

      {/* Scrolling Content Layer */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-4xl">
            <motion.h1
              className="text-6xl md:text-8xl font-serif font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              Future History
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              A history book that writes itself based on real-time prediction
              markets
            </motion.p>
            <motion.div
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Scroll to explore the timeline →
            </motion.div>
          </div>
        </div>

        {/* Timeline Sections */}
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {chapters.map((chapter, index) => (
            <TimelineSection
              key={chapter.year}
              chapter={chapter}
              index={index}
              totalChapters={chapters.length}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="min-h-[50vh] flex items-center justify-center px-4">
          <div className="text-center max-w-2xl">
            <div className="text-4xl font-serif mb-4">📖</div>
            <h2 className="text-3xl font-serif mb-4">The Future is Written</h2>
            <p className="text-gray-400 mb-6">
              Generated from {timelineData.chapters.length} years of prediction
              market data
            </p>
            <p className="text-xs text-gray-600">
              Bias: {timelineData.bias} • Generated:{" "}
              {new Date(timelineData.generated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
