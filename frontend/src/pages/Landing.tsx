import { Navbar } from "@/components/landing/Navbar";
import { SceneHero } from "@/components/landing/SceneHero";
import { SceneStruggle } from "@/components/landing/SceneStruggle";
import { SceneReveal } from "@/components/landing/SceneReveal";
import { ScenePipeline } from "@/components/landing/ScenePipeline";
import { SceneCTA } from "@/components/landing/SceneCTA";
import { CursorGlow } from "@/components/CursorGlow";
import { Activity } from "lucide-react";

export default function Landing() {
  return (
    <div className="bg-background min-h-screen">
      <CursorGlow />
      <Navbar />
      <SceneHero />
      <div id="features">
        <SceneStruggle />
      </div>
      <SceneReveal />
      <div id="pipeline">
        <ScenePipeline />
      </div>
      <div id="demo">
        <SceneCTA />
      </div>
      <footer className="py-12 text-center border-t border-border/40">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Sentinel</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">
          © 2026 Sentinel. Autonomous engineering, zero interruptions.
        </p>
      </footer>
    </div>
  );
}
