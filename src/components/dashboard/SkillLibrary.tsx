import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, RotateCw } from "lucide-react";
import { useMission, Skill } from "@/contexts/MissionContext";

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 p-2 relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-neon-cyan/10 pointer-events-none"
      />
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-neon-cyan" />
          <span className="text-[10px] font-semibold text-foreground">{skill.title}</span>
        </div>
        <span className="text-[8px] font-mono text-neon-cyan/70">v{skill.version}</span>
      </div>
      <p className="text-[9px] text-muted-foreground leading-relaxed mb-1.5">{skill.description}</p>
      {skill.improvementLabel && (
        <div className="mb-1.5 inline-flex items-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-1.5 py-0.5 text-[8px] font-mono text-neon-cyan">
          {skill.improvementLabel}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[8px] font-mono text-muted-foreground/70 flex items-center gap-0.5">
          <RotateCw className="w-2 h-2" /> {skill.usageCount}x used
        </span>
        <span className="text-[8px] font-mono text-destructive/60">← {skill.source}</span>
        {skill.scope && <span className="text-[8px] font-mono text-muted-foreground/70">{skill.scope}</span>}
      </div>
    </motion.div>
  );
}

export function SkillLibrary() {
  const { skills } = useMission();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [skills.length]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-neon-cyan" />
        Skill Library
        {skills.length > 0 && (
          <span className="text-[9px] font-mono text-neon-cyan bg-neon-cyan/10 px-1.5 rounded-full">{skills.length}</span>
        )}
      </h2>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2">
        <AnimatePresence>
          {skills.map((skill) => (
            <SkillCard key={skill.skillKey ?? skill.id} skill={skill} />
          ))}
        </AnimatePresence>

        {skills.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs font-mono gap-2">
            <Sparkles className="w-6 h-6 opacity-30" />
            <span>No skills learned yet...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
