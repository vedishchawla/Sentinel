import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#pipeline" },
  { label: "How It Works", href: "#how" },
  { label: "Architecture", href: "#arch" },
];

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 bg-background/70 backdrop-blur-xl border-b border-border/40"
    >
      {/* Left — logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Activity className="w-5 h-5 text-primary" />
        <span className="font-heading font-bold text-lg tracking-tight text-foreground">Sentinel</span>
      </div>

      {/* Center — nav links */}
      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="relative text-sm font-medium text-muted-foreground tracking-wide hover:text-foreground transition-colors duration-200 group"
          >
            {link.label}
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
          </a>
        ))}
      </div>

      {/* Right — CTA */}
      <button
        onClick={() => navigate("/dashboard")}
        className="text-sm font-medium px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.25)]"
      >
        Dashboard
      </button>
    </motion.nav>
  );
};
