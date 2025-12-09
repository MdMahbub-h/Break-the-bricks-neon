import { motion } from "motion/react";
import {
  Trophy,
  RotateCcw,
  Home,
  Star,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Flame,
} from "lucide-react";
import { useState, useEffect } from "react";
import { soundManager } from "../utils/sound";

interface GameOverProps {
  score: number;
  highScore: number;
  won: boolean;
  onRestart: () => void;
  onReturnToStart: () => void;
  onPlayNext?: () => void;
  onLevels: () => void;
  hasNextLevel: boolean;
}

export function GameOver({
  score,
  highScore,
  won,
  onRestart,
  onReturnToStart,
  onPlayNext,
  onLevels,
  hasNextLevel,
}: GameOverProps) {
  const isNewHighScore = score === highScore && score > 0;
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
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="w-full max-w-2xl mx-auto p-8"
    >
      <div className="text-center space-y-4">
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
            transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
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

        {/* Result Title */}
        <div className="space-y-1">
          {won ? (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 150,
                }}
                className="flex justify-center"
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                >
                  <Star
                    className="w-20 h-20"
                    style={{
                      color: "#00d4ff",
                      fill: "#00d4ff",
                      filter: "drop-shadow(0 0 20px #00d4ff)",
                    }}
                  />
                </motion.div>
              </motion.div>
              <motion.h1
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-5xl tracking-wider uppercase"
                style={{
                  color: "#00d4ff",
                  textShadow:
                    "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff",
                  fontWeight: 900,
                }}
              >
                Victory!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl"
                style={{ color: "#80e7ff" }}
              >
                You broke all the bricks!
              </motion.p>
            </>
          ) : (
            <>
              <motion.h1
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl tracking-wider uppercase"
                style={{
                  color: "#00d4ff",
                  textShadow:
                    "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff",
                  fontWeight: 900,
                }}
              >
                Game
                <br />
                Over
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl"
                style={{ color: "#80e7ff" }}
              >
                Better luck next time!
              </motion.p>
            </>
          )}
        </div>

        {/* Score Display */}
        <motion.div
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{
            delay: won ? 0.8 : 0.6,
            duration: 0.7,
            type: "spring",
            stiffness: 120,
          }}
          className="inline-block px-12 py-4 rounded-lg"
          style={{
            backgroundColor: "rgba(0, 212, 255, 0.1)",
            border: "3px solid #00d4ff",
            boxShadow: "0 0 30px rgba(0, 212, 255, 0.4)",
          }}
        >
          <div className="space-y-4">
            <div>
              <div
                className="text-sm uppercase tracking-wide"
                style={{ color: "#80e7ff" }}
              >
                Your Score
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: won ? 1 : 0.8,
                  type: "spring",
                  stiffness: 200,
                }}
                className="text-5xl"
                style={{
                  color: "#00d4ff",
                  textShadow: "0 0 15px #00d4ff",
                }}
              >
                {score}
              </motion.div>
            </div>

            {isNewHighScore && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{
                  delay: won ? 1.2 : 1,
                  type: "spring",
                  stiffness: 200,
                }}
                className="px-4 py-2 rounded"
                style={{
                  backgroundColor: "rgba(0, 212, 255, 0.2)",
                  border: "1px solid #00d4ff",
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="flex items-center gap-2 justify-center"
                >
                  <Trophy className="w-5 h-5" style={{ color: "#00d4ff" }} />
                  <span style={{ color: "#00d4ff" }}>New High Score!</span>
                </motion.div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: won ? 1.4 : 1.2 }}
              className="pt-4 border-t"
              style={{ borderColor: "rgba(0, 212, 255, 0.3)" }}
            >
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="w-5 h-5" style={{ color: "#80e7ff" }} />
                <div>
                  <div
                    className="text-xs uppercase tracking-wide"
                    style={{ color: "#80e7ff" }}
                  >
                    High Score
                  </div>
                  <div className="text-2xl" style={{ color: "#00d4ff" }}>
                    {highScore}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: won ? 1.9 : 1.7, duration: 0.5 }}
          className="flex flex-col gap-3 sm:gap-4 pt-4 w-full max-w-sm mx-auto"
        >
          {won && hasNextLevel && onPlayNext && (
            <motion.button
              onClick={onPlayNext}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 text-lg uppercase tracking-widest rounded-lg flex items-center justify-center gap-3"
              style={{
                backgroundColor: "#00ff88",
                color: "#000",
                boxShadow: "0 0 30px #00ff88, 0 0 60px rgba(0, 255, 136, 0.5)",
                fontWeight: 700,
              }}
            >
              <Star className="w-5 h-5" />
              Play Next
            </motion.button>
          )}

          {!won && (
            <motion.button
              onClick={onRestart}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 sm:gap-3 min-h-[48px]"
              style={{
                backgroundColor: "#00d4ff",
                color: "#000",
                boxShadow: "0 0 30px #00d4ff, 0 0 60px rgba(0, 212, 255, 0.5)",
                fontWeight: 700,
              }}
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </motion.button>
          )}

          <motion.button
            onClick={onLevels}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 sm:px-10 py-3 text-base sm:text-lg uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 sm:gap-3 min-h-[48px]"
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

          <motion.button
            onClick={onReturnToStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 sm:px-10 py-3 text-base sm:text-lg uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 sm:gap-3 min-h-[48px]"
            style={{
              backgroundColor: "transparent",
              color: "#00d4ff",
              border: "2px solid #00d4ff",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
            }}
          >
            <Home className="w-5 h-5" />
            Main Menu
          </motion.button>
        </motion.div>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-2 pt-4">
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{
                delay: won ? 1.8 + i * 0.05 : 1.6 + i * 0.05,
                type: "spring",
                stiffness: 300,
              }}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: "#00d4ff",
                boxShadow: "0 0 10px #00d4ff",
              }}
              animate-pulse={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition-pulse={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
