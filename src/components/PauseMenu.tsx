import { motion } from "motion/react";
import { Play, Home, RotateCcw, Flame } from "lucide-react";

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onLevels: () => void;
}

export function PauseMenu({
  onResume,
  onRestart,
  onMainMenu,
  onLevels,
}: PauseMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(3, 7, 18, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="space-y-6 p-8"
      >
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl uppercase tracking-wider text-center"
          style={{
            color: "#00d4ff",
            textShadow: "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff",
            fontWeight: 900,
          }}
        >
          Paused
        </motion.h2>

        {/* Menu Options */}
        <div className="space-y-3 sm:space-y-4 min-w-[280px] sm:min-w-[300px]">
          {/* Resume */}
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            // transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onResume}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg uppercase tracking-widest transition-all min-h-[48px]"
            style={{
              backgroundColor: "#00d4ff",
              color: "#000",
              boxShadow: "0 0 30px rgba(0, 212, 255, 0.5)",
              fontWeight: 700,
            }}
          >
            <Play className="w-5 h-5" />
            Resume
          </motion.button>

          {/* Restart Level */}
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            // transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg uppercase tracking-widest transition-all min-h-[48px]"
            style={{
              backgroundColor: "transparent",
              color: "#00d4ff",
              border: "2px solid #00d4ff",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
            }}
          >
            <RotateCcw className="w-5 h-5" />
            Restart
          </motion.button>

          {/* Levels */}
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            // transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLevels}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg uppercase tracking-widest transition-all min-h-[48px]"
            style={{
              backgroundColor: "transparent",
              color: "#ffaa00",
              border: "2px solid #ffaa00",
              boxShadow: "0 0 15px rgba(255, 170, 0, 0.3)",
            }}
          >
            <Flame className="w-5 h-5" />
            Levels
          </motion.button>

          {/* Main Menu */}
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            // transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMainMenu}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg uppercase tracking-widest transition-all min-h-[48px]"
            style={{
              backgroundColor: "transparent",
              color: "#ff0066",
              border: "2px solid #ff0066",
              boxShadow: "0 0 15px rgba(255, 0, 102, 0.3)",
            }}
          >
            <Home className="w-5 h-5" />
            Main Menu
          </motion.button>
        </div>

        {/* Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm pt-4"
          style={{ color: "#80e7ff" }}
        >
          Press ESC to resume
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
