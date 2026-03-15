import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

export const SceneCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="relative z-20 bg-background min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <h2 className="text-4xl md:text-6xl font-bold tracking-display text-foreground mb-6">
          Watch the AI engineer
          <br />
          <span className="text-primary text-glow">debug the system.</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-12 text-lg">
          See Sentinel autonomously identify, diagnose, fix, and validate
          a production incident in real time.
        </p>

        <motion.button
          onClick={() => navigate("/dashboard")}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg border-glow transition-all text-sm"
        >
          <Activity className="w-5 h-5" />
          Run Live Demo
        </motion.button>

        <div className="mt-8 font-mono text-xs text-muted-foreground">
          <span className="text-primary">$</span> npx sentinel@latest init
        </div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          {[
            { value: "142s", label: "Mean Time to Resolution" },
            { value: "98.7%", label: "Fix Accuracy" },
            { value: "12x", label: "Faster Than Manual" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary font-mono">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-2 font-mono">{m.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};
