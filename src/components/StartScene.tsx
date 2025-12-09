import { motion } from "motion/react";
import {
  Trophy,
  Gamepad2,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { useState, useEffect } from "react";
import { soundManager } from "../utils/sound";

interface StartSceneProps {
  onStartGame: () => void;
  highScore: number;
}

export function StartScene({ onStartGame, highScore }: StartSceneProps) {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    soundManager.setEnabled(newSoundState);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto p-4 md:p-8"
    >
      <div className="text-center space-y-8">
        {/* Controls at top */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.8,
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="flex justify-end gap-2"
        >
          {/* Sound Toggle */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleSound}
            className="p-2 rounded-lg transition-all"
            style={{
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              border: "2px solid #00d4ff",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
            }}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" style={{ color: "#00d4ff" }} />
            ) : (
              <VolumeX className="w-5 h-5" style={{ color: "#00d4ff" }} />
            )}
          </motion.button>

          {/* Fullscreen Toggle */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg transition-all"
            style={{
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              border: "2px solid #00d4ff",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
            }}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" style={{ color: "#00d4ff" }} />
            ) : (
              <Maximize className="w-5 h-5" style={{ color: "#00d4ff" }} />
            )}
          </motion.button>
        </motion.div>

        {/* Title */}
        <div className="space-y-2 md:space-y-4">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.2,
              duration: 0.8,
              type: "spring",
              stiffness: 100,
            }}
            className="text-4xl md:text-6xl tracking-wider uppercase"
            style={{
              color: "#00d4ff",
              textShadow:
                "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #0099ff",
              fontWeight: 900,
            }}
          >
            Block
          </motion.h1>
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: 0.4,
              duration: 0.8,
              type: "spring",
              stiffness: 100,
            }}
            className="text-4xl md:text-6xl tracking-wider uppercase"
            style={{
              color: "#00d4ff",
              textShadow:
                "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #0099ff",
              fontWeight: 900,
            }}
          >
            Journey
          </motion.h1>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.6,
              duration: 0.8,
              type: "spring",
              stiffness: 150,
            }}
            className="flex justify-center"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Gamepad2
                className="w-12 h-12 md:w-16 md:h-16"
                style={{
                  color: "#00d4ff",
                  filter: "drop-shadow(0 0 10px #00d4ff)",
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* High Score */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 1.1,
            duration: 0.5,
            type: "spring",
            stiffness: 200,
          }}
          className="inline-block px-4 md:px-8 py-2 md:py-4 rounded-lg"
          style={{
            backgroundColor: "rgba(0, 212, 255, 0.1)",
            border: "2px solid #00d4ff",
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)",
          }}
        >
          <div className="flex items-center gap-3 justify-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Trophy
                className="w-4 h-4 md:w-6 md:h-6"
                style={{ color: "#00d4ff" }}
              />
            </motion.div>
            <div>
              <div
                className="text-sm uppercase tracking-wide"
                style={{ color: "#00d4ff" }}
              >
                High Score
              </div>
              <div
                className="text-xl md:text-3xl"
                style={{
                  color: "#00d4ff",
                  textShadow: "0 0 10px #00d4ff",
                }}
              >
                {highScore}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="py-4"
        >
          <motion.button
            onClick={onStartGame}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 30px #00d4ff, 0 0 60px rgba(0, 212, 255, 0.5)",
                "0 0 40px #00d4ff, 0 0 80px rgba(0, 212, 255, 0.7)",
                "0 0 30px #00d4ff, 0 0 60px rgba(0, 212, 255, 0.5)",
              ],
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            }}
            className="px-8 md:px-12 py-3 md:py-4 text-lg md:text-xl uppercase tracking-widest rounded-lg"
            style={{
              backgroundColor: "#00d4ff",
              color: "#000",
              fontWeight: 700,
            }}
          >
            Start Game
          </motion.button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="max-w-md mx-auto p-4 md:p-6 rounded-lg space-y-3 md:space-y-4"
          style={{
            backgroundColor: "rgba(0, 212, 255, 0.05)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
          }}
        >
          <h3
            className="text-base md:text-lg uppercase tracking-wide"
            style={{ color: "#00d4ff" }}
          >
            How to Play
          </h3>
          <div
            className="space-y-2 md:space-y-3 text-xs md:text-sm"
            style={{ color: "#80e7ff" }}
          >
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="flex items-center gap-3 justify-center"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <span>Move the paddle to save the Ball</span>
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Break all bricks to win
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              Don't let the ball fall!
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
              className="pt-1 md:pt-2 text-xs md:text-sm"
              style={{ color: "#00d4ff" }}
            >
              3 Lives • 10 Points per Brick
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-2 pt-4">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 1.8 + i * 0.1,
                type: "spring",
                stiffness: 300,
              }}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#00d4ff",
                boxShadow: "0 0 10px #00d4ff",
              }}
              animate-pulse={{
                scale: [1, 1.3, 1],
                opacity: [1, 0.5, 1],
              }}
              transition-pulse={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
