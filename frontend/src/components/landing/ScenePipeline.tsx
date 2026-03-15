import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Search, Target, Code, TestTube, Shield, GitPullRequest, FileText } from "lucide-react";

const PIPELINE_STEPS = [
  { icon: AlertTriangle, label: "Incident Ticket", desc: "Ingest from Jira, PagerDuty, Sentry" },
  { icon: FileText, label: "Ticket Understanding", desc: "Parse error context and stack traces" },
  { icon: Search, label: "Codebase Analysis", desc: "Map repository structure and dependencies" },
  { icon: Target, label: "Root Cause Detection", desc: "Identify fault origin across services" },
  { icon: Code, label: "Fix Generation", desc: "Synthesize minimal, correct patch" },
  { icon: TestTube, label: "Test Generation", desc: "Create regression test coverage" },
  { icon: Shield, label: "Sandbox Validation", desc: "Build, lint, test in isolated environment" },
  { icon: GitPullRequest, label: "Pull Request Creation", desc: "Open PR with full context and diff" },
];

export const ScenePipeline = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={ref} className="relative min-h-[200vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center py-16 px-4">
        <motion.h2
          style={{ opacity: useTransform(scrollYProgress, [0.05, 0.15], [0, 1]) }}
          className="text-3xl md:text-5xl font-bold tracking-display text-foreground mb-4 text-center"
        >
          The Autonomous Pipeline
        </motion.h2>
        <motion.p
          style={{ opacity: useTransform(scrollYProgress, [0.08, 0.18], [0, 1]) }}
          className="text-muted-foreground mb-12 font-mono text-sm text-center"
        >
          8 stages. Zero human intervention.
        </motion.p>

        <div className="relative flex flex-col items-center gap-1 max-w-md w-full">
          {/* Background line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />
          {/* Animated progress line */}
          <motion.div
            style={{
              scaleY: useTransform(scrollYProgress, [0.15, 0.8], [0, 1]),
            }}
            className="absolute left-1/2 top-0 bottom-0 w-px bg-primary -translate-x-1/2 origin-top shadow-[0_0_10px_hsl(142_70%_50%/0.4)]"
          />

          {PIPELINE_STEPS.map((step, i) => {
            const start = 0.15 + i * 0.075;
            return (
              <motion.div
                key={step.label}
                style={{
                  opacity: useTransform(scrollYProgress, [start, start + 0.05], [0.2, 1]),
                }}
                className="relative z-10 flex items-center gap-4 w-full py-3"
              >
                <div className="flex-1 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{step.desc}</p>
                  </div>
                </div>
                <motion.div
                  style={{
                    scale: useTransform(scrollYProgress, [start, start + 0.05], [0.5, 1]),
                  }}
                  className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center shrink-0"
                >
                  <step.icon className="w-4 h-4 text-primary" />
                </motion.div>
                <div className="flex-1" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
