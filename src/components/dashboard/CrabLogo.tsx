import { motion } from "framer-motion";

export function CrabLogo() {
  return (
    <motion.div
      className="relative w-8 h-8 flex items-center justify-center"
      animate={{ filter: ["drop-shadow(0 0 4px hsl(270 100% 65% / 0.6))", "drop-shadow(0 0 8px hsl(185 100% 55% / 0.6))", "drop-shadow(0 0 4px hsl(270 100% 65% / 0.6))"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-7 h-7"
      >
        {/* Body */}
        <ellipse cx="32" cy="36" rx="16" ry="12" fill="hsl(270 100% 65% / 0.3)" stroke="hsl(270 100% 65%)" strokeWidth="1.5" />
        {/* Left claw */}
        <motion.path
          d="M16 32 C8 26 4 20 10 16 C14 14 16 18 18 24"
          stroke="hsl(185 100% 55%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{ d: ["M16 32 C8 26 4 20 10 16 C14 14 16 18 18 24", "M16 32 C6 28 2 22 8 17 C12 15 15 19 18 24", "M16 32 C8 26 4 20 10 16 C14 14 16 18 18 24"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Right claw */}
        <motion.path
          d="M48 32 C56 26 60 20 54 16 C50 14 48 18 46 24"
          stroke="hsl(185 100% 55%)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{ d: ["M48 32 C56 26 60 20 54 16 C50 14 48 18 46 24", "M48 32 C58 28 62 22 56 17 C52 15 49 19 46 24", "M48 32 C56 26 60 20 54 16 C50 14 48 18 46 24"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        {/* Eyes */}
        <circle cx="26" cy="30" r="2" fill="hsl(185 100% 55%)" />
        <circle cx="38" cy="30" r="2" fill="hsl(185 100% 55%)" />
        {/* Legs left */}
        <line x1="18" y1="38" x2="8" y2="44" stroke="hsl(270 100% 65% / 0.6)" strokeWidth="1.2" />
        <line x1="17" y1="42" x2="6" y2="46" stroke="hsl(270 100% 65% / 0.6)" strokeWidth="1.2" />
        <line x1="18" y1="46" x2="10" y2="52" stroke="hsl(270 100% 65% / 0.6)" strokeWidth="1.2" />
        {/* Legs right */}
        <line x1="46" y1="38" x2="56" y2="44" stroke="hsl(270 100% 65% / 0.6)" strokeWidth="1.2" />
        <line x1="47" y1="42" x2="58" y2="46" stroke="hsl(270 100% 65% / 0.6)" strokeWidth="1.2" />
        <line x1="46" y1="46" x2="54" y2="52" stroke="hsl(270 100% 65% / 0.6)" strokeWidth="1.2" />
      </svg>
    </motion.div>
  );
}
