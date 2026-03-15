import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const CODE_WINDOWS = [
  { name: "sentry-logs.json", content: '{ "error": "NullPointerException", "count": 2847 }' },
  { name: "main.py", content: "def process_order(order):\n    return order.items.total()  # AttributeError" },
  { name: "PR #402", content: "fix: handle null cart items\n+  if not order.items:\n+    return 0" },
  { name: "Dockerfile", content: "FROM node:18-alpine\nRUN npm ci --production" },
  { name: "k8s-deploy.yaml", content: "replicas: 3\nresources:\n  limits:\n    memory: 512Mi" },
  { name: "auth.ts", content: "const token = jwt.verify(req.headers.auth)\n// TypeError: undefined" },
  { name: "test_cart.py", content: "def test_empty_cart():\n    assert cart.total() == 0  # FAILED" },
  { name: "nginx.conf", content: "upstream backend {\n  server 10.0.3.42:8080;  # UNREACHABLE\n}" },
  { name: "package.json", content: '"sharp": "^0.32.1"  // native build failed' },
  { name: "redis.log", content: "CLUSTERDOWN The cluster is down" },
  { name: ".env.prod", content: "DATABASE_URL=postgres://...  # CONNECTION_REFUSED" },
  { name: "grafana-alert", content: "🔴 P95 Latency > 2000ms for 5 minutes" },
];

export const SceneStruggle = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const blur = useTransform(scrollYProgress, [0.3, 0.7], [0, 8]);
  const speed = useTransform(scrollYProgress, [0.3, 0.7], [0, -200]);
  const textScale = useTransform(scrollYProgress, [0.5, 0.85], [1, 4]);
  const textOpacity = useTransform(scrollYProgress, [0.5, 0.7, 0.85, 0.9], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative min-h-[250vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Text overlay */}
        <motion.div
          style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [0, 1]) }}
          className="absolute z-20 top-12 text-center px-4"
        >
          <p className="text-lg md:text-xl text-muted-foreground font-mono">
            Engineers inspect logs. Search repositories. Test fixes manually.
          </p>
        </motion.div>

        {/* Window grid */}
        <motion.div
          style={{
            filter: useTransform(blur, (v) => `blur(${v}px)`),
            y: speed,
          }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 max-w-6xl"
        >
          {CODE_WINDOWS.map((win, i) => (
            <motion.div
              key={win.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              viewport={{ once: true }}
              className="surface-card rounded-md overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive/60" />
                  <span className="w-2 h-2 rounded-full bg-warning/60" />
                  <span className="w-2 h-2 rounded-full bg-success/60" />
                </div>
                <span className="font-mono text-xs text-muted-foreground truncate">{win.name}</span>
              </div>
              <pre className="p-3 font-mono text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {win.content}
              </pre>
            </motion.div>
          ))}
        </motion.div>

        {/* "Hours pass." */}
        <motion.div
          style={{ scale: textScale, opacity: textOpacity }}
          className="absolute z-30 text-center"
        >
          <span className="text-4xl md:text-6xl font-bold tracking-display text-foreground">
            Hours pass.
          </span>
        </motion.div>
      </div>
    </section>
  );
};
