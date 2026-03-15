import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ERROR_LOGS = [
  "ERROR [2026-03-15T08:42:11Z] NullPointerException in ShopService.getCart()",
  "FATAL [2026-03-15T08:42:12Z] Connection refused: postgres://db:5432",
  "ERROR [2026-03-15T08:42:13Z] TypeError: Cannot read property 'id' of undefined",
  "WARN  [2026-03-15T08:42:14Z] Memory usage exceeded 90% threshold",
  "ERROR [2026-03-15T08:42:15Z] ECONNRESET: socket hang up at Agent.onSocket",
  "FATAL [2026-03-15T08:42:16Z] Unhandled promise rejection: AuthTokenExpired",
  "ERROR [2026-03-15T08:42:17Z] 500 Internal Server Error: /api/v2/checkout",
  "WARN  [2026-03-15T08:42:18Z] Redis cluster node unreachable: 10.0.3.42",
  "ERROR [2026-03-15T08:42:19Z] Segfault in native module: sharp@0.32.1",
  "FATAL [2026-03-15T08:42:20Z] OOMKilled: container exceeded 512Mi limit",
  "ERROR [2026-03-15T08:42:21Z] CORS policy blocked: Origin not allowed",
  "ERROR [2026-03-15T08:42:22Z] deadlock detected in transaction 0x4f2a",
  "WARN  [2026-03-15T08:42:23Z] SSL certificate expires in 2 days",
  "ERROR [2026-03-15T08:42:24Z] gRPC call failed: UNAVAILABLE: upstream connect error",
];

export const TerminalBackground = () => {
  const [lines, setLines] = useState<{ id: number; text: string; y: number }[]>([]);

  useEffect(() => {
    let counter = 0;
    const interval = setInterval(() => {
      const text = ERROR_LOGS[counter % ERROR_LOGS.length];
      setLines((prev) => {
        const newLines = [...prev, { id: counter, text, y: Math.random() * 100 }];
        return newLines.slice(-20);
      });
      counter++;
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((line) => (
        <motion.div
          key={line.id}
          initial={{ opacity: 0, y: `${line.y}%` }}
          animate={{ opacity: 0.08, y: `${line.y - 20}%` }}
          exit={{ opacity: 0 }}
          transition={{ duration: 8, ease: "linear" }}
          className="absolute left-0 right-0 px-8 font-mono text-xs text-destructive whitespace-nowrap"
        >
          {line.text}
        </motion.div>
      ))}
    </div>
  );
};
