import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const SceneReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const questionOpacity = useTransform(scrollYProgress, [0.1, 0.25, 0.4, 0.5], [0, 1, 1, 0]);
  const revealOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1]);
  const cursorWidth = useTransform(scrollYProgress, [0.5, 0.7], [2, 300]);

  return (
    <section ref={ref} className="relative min-h-[200vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center">
        {/* The Question */}
        <motion.div style={{ opacity: questionOpacity }} className="absolute text-center px-4">
          <h2 className="text-4xl md:text-7xl font-bold tracking-display text-foreground leading-tight">
            What if incidents could
            <br />
            <span className="text-primary text-glow">resolve themselves?</span>
          </h2>
        </motion.div>

        {/* The Reveal */}
        <motion.div style={{ opacity: revealOpacity }} className="absolute text-center px-4">
          {/* Cursor line */}
          <motion.div
            style={{ width: cursorWidth }}
            className="h-[2px] bg-primary mx-auto mb-12 rounded-full shadow-[0_0_20px_hsl(142_70%_50%/0.5)]"
          />
          <motion.h2
            className="text-5xl md:text-8xl font-bold tracking-display text-foreground"
          >
            Sentinel<span className="text-primary">.</span>
          </motion.h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Autonomous Incident-to-Fix Engineering Agent
          </p>
          <p className="mt-4 text-sm text-muted-foreground font-mono max-w-xl mx-auto">
            Reads incident tickets. Analyzes repositories. Generates fixes.
            <br />
            Validates them. Creates pull requests. Automatically.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
