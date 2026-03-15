import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { TerminalBackground } from "./TerminalBackground";
import { InteractiveGrid } from "@/components/InteractiveGrid";

export const SceneHero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [0, -100]);
  const subOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);

  return (
    <motion.section
      ref={ref}
      className="relative min-h-[200vh]"
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Interactive grid background */}
        <div className="absolute inset-0 pointer-events-none">
          <InteractiveGrid />
        </div>
        <TerminalBackground />
        <motion.div style={{ opacity, y }} className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold tracking-display text-foreground"
          >
            Software breaks.
            <br />
            <span className="text-destructive">Constantly.</span>
          </motion.h1>
          <motion.p
            style={{ opacity: subOpacity }}
            className="mt-8 font-mono text-sm text-muted-foreground max-w-lg mx-auto"
          >
            SYSTEM_FAILURE: NULL_POINTER_EXCEPTION at ShopService.java:142
          </motion.p>
        </motion.div>

        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0.3, 0.55], [0, 1]) }}
          className="absolute bottom-32 z-10 text-center px-4"
        >
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Production incidents happen every day.
            <br />
            <span className="text-foreground font-medium">Yet debugging is still manual.</span>
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};
