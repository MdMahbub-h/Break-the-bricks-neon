import { motion } from "motion/react";
import {
  ArrowLeft,
  Zap,
  Flame,
  Skull,
  Star,
  Lock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { Level } from "../App";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { soundManager } from "../utils/sound";

interface LevelSelectionProps {
  onSelectLevel: (level: Level) => void;
  onBack: () => void;
  unlockedLevels: number[];
}

// Generate all 80 levels
function generateLevels(): Level[] {
  const levels: Level[] = [];

  // Beginner: Levels 1-20
  for (let i = 1; i <= 20; i++) {
    levels.push({
      id: i,
      name: `Level ${i}`,
      difficulty: "Beginner",
      levelNumber: i,
      rows: Math.min(3 + Math.floor(i / 5), 5),
      columns: Math.min(6 + Math.floor(i / 4), 8),
      maxBrickHits: Math.min(1 + Math.floor(i / 7), 2),
      ballSpeed: 6 + i * 0.05,
    });
  }

  // Intermediate: Levels 21-40
  for (let i = 1; i <= 20; i++) {
    levels.push({
      id: 20 + i,
      name: `Level ${i}`,
      difficulty: "Intermediate",
      levelNumber: i,
      rows: Math.min(5 + Math.floor(i / 5), 7),
      columns: Math.min(7 + Math.floor(i / 4), 9),
      maxBrickHits: Math.min(2 + Math.floor(i / 6), 3),
      ballSpeed: 7 + i * 0.08,
    });
  }

  // Advanced: Levels 41-60
  for (let i = 1; i <= 20; i++) {
    levels.push({
      id: 40 + i,
      name: `Level ${i}`,
      difficulty: "Advanced",
      levelNumber: i,
      rows: Math.min(6 + Math.floor(i / 4), 8),
      columns: Math.min(8 + Math.floor(i / 3), 10),
      maxBrickHits: Math.min(3 + Math.floor(i / 5), 4),
      ballSpeed: 8 + i * 0.1,
    });
  }

  // Expert: Levels 61-80
  for (let i = 1; i <= 20; i++) {
    levels.push({
      id: 60 + i,
      name: `Level ${i}`,
      difficulty: "Expert",
      levelNumber: i,
      rows: Math.min(7 + Math.floor(i / 3), 9),
      columns: Math.min(9 + Math.floor(i / 3), 11),
      maxBrickHits: Math.min(4 + Math.floor(i / 4), 5),
      ballSpeed: 9 + i * 0.12,
    });
  }

  return levels;
}

const allLevels = generateLevels();

const difficultyConfig = {
  Beginner: {
    icon: Star,
    color: "#00d4ff",
    gradient: "from-cyan-500 to-blue-500",
  },
  Intermediate: {
    icon: Zap,
    color: "#00ff88",
    gradient: "from-green-500 to-emerald-500",
  },
  Advanced: {
    icon: Flame,
    color: "#ffaa00",
    gradient: "from-orange-500 to-amber-500",
  },
  Expert: {
    icon: Skull,
    color: "#ff0066",
    gradient: "from-pink-500 to-rose-500",
  },
};

export function LevelSelection({
  onSelectLevel,
  onBack,
  unlockedLevels,
}: LevelSelectionProps) {
  const [selectedTab, setSelectedTab] = useState<
    "Beginner" | "Intermediate" | "Advanced" | "Expert"
  >("Beginner");
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

  const getLevelsByDifficulty = (
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  ) => {
    return allLevels.filter((level) => level.difficulty === difficulty);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-6xl mx-auto p-4 sm:p-8"
    >
      <div className="space-y-6">
        {/* Header with Back Button and Controls */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-2 py-15 rounded-lg flex items-center gap-1.5 text-sm uppercase tracking-widest transition-all"
            style={{
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              color: "#00d4ff",
              border: "2px solid #00d4ff",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
            }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>

          {/* Title */}
          <motion.h1
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.3,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
            }}
            className="text-xl sm:text-3xl uppercase tracking-wider text-center flex-1"
            style={{
              color: "#00d4ff",
              textShadow:
                "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff",
              fontWeight: 900,
            }}
          >
            Select Level
          </motion.h1>

          {/* Controls */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-1.5"
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
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
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
        </div>

        {/* Tabs for Difficulty Tiers */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-h-[300px] sm:max-h-[400px]"
        >
          <Tabs
            value={selectedTab}
            onValueChange={(value) => setSelectedTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 rounded-xl border border-cyan-500/30">
              {(
                ["Beginner", "Intermediate", "Advanced", "Expert"] as const
              ).map((difficulty, index) => {
                const config = difficultyConfig[difficulty];
                const Icon = config.icon;

                return (
                  <TabsTrigger
                    key={difficulty}
                    value={difficulty}
                    className="relative data-[state=active]:bg-transparent"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex flex-col items-center gap-0.5 decrese height of beginner, intermediate, advanced, ecpert menu in levelselection page py-2 rounded-sm transition-all relative z-10"
                      style={{
                        color:
                          selectedTab === difficulty ? config.color : "#6b7280",
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-xs">{difficulty}</span>
                    </motion.div>
                    {selectedTab === difficulty && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          backgroundColor: `${config.color}15`,
                          border: `2px solid ${config.color}`,
                          boxShadow: `0 0 20px ${config.color}40`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {(["Beginner", "Intermediate", "Advanced", "Expert"] as const).map(
              (difficulty) => {
                const levels = getLevelsByDifficulty(difficulty);
                const config = difficultyConfig[difficulty];

                return (
                  <TabsContent
                    key={difficulty}
                    value={difficulty}
                    className="mt-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: `${config.color} transparent`,
                      }}
                    >
                      {levels.map((level, index) => {
                        const Icon = config.icon;

                        return (
                          <motion.button
                            key={level.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02, duration: 0.3 }}
                            whileHover={
                              unlockedLevels.includes(level.id)
                                ? { scale: 1.1, y: -5 }
                                : {}
                            }
                            whileTap={
                              unlockedLevels.includes(level.id)
                                ? { scale: 0.95 }
                                : {}
                            }
                            onClick={() =>
                              unlockedLevels.includes(level.id) &&
                              onSelectLevel(level)
                            }
                            className={`relative p-1 sm:p-2 rounded-xl transition-all group aspect-square flex flex-col items-center justify-center ${
                              unlockedLevels.includes(level.id)
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            }`}
                            style={{
                              backgroundColor: unlockedLevels.includes(level.id)
                                ? "rgba(0, 0, 0, 0.5)"
                                : "rgba(0, 0, 0, 0.3)",
                              border: `2px solid ${
                                unlockedLevels.includes(level.id)
                                  ? config.color
                                  : "#666"
                              }`,
                              boxShadow: unlockedLevels.includes(level.id)
                                ? `0 0 15px ${config.color}30`
                                : "none",
                              opacity: unlockedLevels.includes(level.id)
                                ? 1
                                : 0.5,
                            }}
                          >
                            {/* Hover Glow Effect */}
                            {unlockedLevels.includes(level.id) && (
                              <motion.div
                                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{
                                  background: `radial-gradient(circle at center, ${config.color}20, transparent 70%)`,
                                }}
                              />
                            )}

                            {/* Lock Icon for Locked Levels */}
                            {!unlockedLevels.includes(level.id) && (
                              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                                <Lock
                                  className="w-8 h-8"
                                  style={{ color: "#666" }}
                                />
                              </div>
                            )}

                            <div className="relative z-10 space-y-2 flex flex-col items-center">
                              {/* Level Number */}
                              <div
                                className="text-sm sm:text-lg md:text-xl"
                                style={{
                                  color: config.color,
                                  textShadow: `0 0 10px ${config.color}`,
                                  fontWeight: 900,
                                }}
                              >
                                {level.levelNumber}
                              </div>

                              {/* Mini Stats */}
                              <div
                                className="text-xs space-y-1 hidden md:block"
                                style={{ color: `${config.color}aa` }}
                              >
                                <div>
                                  {level.rows}×{level.columns}
                                </div>
                                <div className="flex items-center gap-1 justify-center">
                                  {[...Array(level.maxBrickHits)].map(
                                    (_, i) => (
                                      <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{
                                          backgroundColor: config.color,
                                        }}
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Decorative Corner Icon */}
                            <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-40 transition-opacity">
                              <Icon
                                className="w-4 h-4"
                                style={{ color: config.color }}
                              />
                            </div>

                            {/* Animated Border Pulse */}
                            {unlockedLevels.includes(level.id) && (
                              <motion.div
                                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                                style={{
                                  border: `2px solid ${config.color}`,
                                }}
                                animate={{
                                  scale: [1, 1.05, 1],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </TabsContent>
                );
              }
            )}
          </Tabs>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-4 sm:gap-8 pt-4"
        >
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "#80e7ff" }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: difficultyConfig[selectedTab].color }}
            />
            <span>20 Levels</span>
          </div>
          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: "#80e7ff" }}
          >
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: difficultyConfig[selectedTab].color,
                  }}
                />
              ))}
            </div>
            <span>Brick Hits</span>
          </div>
        </motion.div>

        {/* Decorative Bottom Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-3 pt-4"
        >
          {Object.values(difficultyConfig).map((config, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: config.color,
                boxShadow: `0 0 15px ${config.color}`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
