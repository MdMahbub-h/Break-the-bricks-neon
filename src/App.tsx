import { useState } from "react";
import { SplashScene } from "./components/SplashScene";
import { StartScene } from "./components/StartScene";
import { LevelSelection } from "./components/LevelSelection";
import { GameScene } from "./components/GameScene";
import { GameOver } from "./components/GameOver";

type GameState =
  | "splash"
  | "start"
  | "levelSelection"
  | "playing"
  | "gameOver"
  | "win";

export type Level = {
  id: number;
  name: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  rows: number;
  columns: number;
  maxBrickHits: number;
  ballSpeed: number;
  levelNumber: number; // Level number within difficulty tier (1-20)
};

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

export default function App() {
  const [gameState, setGameState] = useState<GameState>("splash");
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("breakBricksHighScore");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    const saved = localStorage.getItem("breakBricksUnlockedLevels");
    return saved ? JSON.parse(saved) : [1]; // Start with only level 1 unlocked
  });
  const [restartCount, setRestartCount] = useState(0);

  const handleGoToLevelSelection = () => {
    setGameState("levelSelection");
  };

  const handleStartGame = (level: Level) => {
    setSelectedLevel(level);
    setGameState("playing");
    setScore(0);
  };

  const handleGameOver = (finalScore: number, won: boolean) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem("breakBricksHighScore", finalScore.toString());
    }

    // Unlock next level on win
    if (won && selectedLevel) {
      const nextLevelId = selectedLevel.id + 1;
      // const nextLevelId = 60;
      if (nextLevelId <= 80 && !unlockedLevels.includes(nextLevelId)) {
        const newUnlockedLevels = [...unlockedLevels, nextLevelId];
        setUnlockedLevels(newUnlockedLevels);
        localStorage.setItem(
          "breakBricksUnlockedLevels",
          JSON.stringify(newUnlockedLevels)
        );
      }
    }

    setGameState(won ? "win" : "gameOver");
  };

  const handleReturnToStart = () => {
    setGameState("start");
    setSelectedLevel(null);
  };

  const handleSplashEnd = () => {
    setGameState("start");
  };

  const handleBackToLevelSelection = () => {
    setGameState("levelSelection");
  };

  const handleRestartCurrentLevel = () => {
    if (selectedLevel) {
      setGameState("playing");
      setScore(0);
      setRestartCount((prev) => prev + 1);
    }
  };

  const handlePlayNext = (level: Level) => {
    setSelectedLevel(level);
    setGameState("playing");
    setScore(0);
  };

  const getNextLevel = (currentLevel: Level): Level | null => {
    const nextId = currentLevel.id + 1;
    if (nextId <= 80 && unlockedLevels.includes(nextId)) {
      return allLevels.find((l) => l.id === nextId) || null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center overflow-hidden">
      {gameState === "splash" && <SplashScene onVideoEnd={handleSplashEnd} />}
      {gameState === "start" && (
        <StartScene
          onStartGame={handleGoToLevelSelection}
          highScore={highScore}
        />
      )}
      {gameState === "levelSelection" && (
        <LevelSelection
          onSelectLevel={handleStartGame}
          onBack={handleReturnToStart}
          unlockedLevels={unlockedLevels}
        />
      )}
      {gameState === "playing" && selectedLevel && (
        <GameScene
          key={`${selectedLevel.id}-${restartCount}`}
          level={selectedLevel}
          onGameOver={handleGameOver}
          onReturnToLevelSelection={handleBackToLevelSelection}
          onReturnToMainMenu={handleReturnToStart}
          onRestartCurrentLevel={handleRestartCurrentLevel}
          restartTrigger={restartCount}
        />
      )}
      {(gameState === "gameOver" || gameState === "win") && selectedLevel && (
        <GameOver
          score={score}
          highScore={highScore}
          won={gameState === "win"}
          onRestart={handleRestartCurrentLevel}
          onReturnToStart={handleReturnToStart}
          onPlayNext={
            gameState === "win"
              ? () => {
                  const nextLevel = getNextLevel(selectedLevel);
                  if (nextLevel) {
                    handlePlayNext(nextLevel);
                  } else {
                    handleBackToLevelSelection();
                  }
                }
              : undefined
          }
          onLevels={handleBackToLevelSelection}
          hasNextLevel={
            gameState === "win" && getNextLevel(selectedLevel) !== null
          }
        />
      )}
    </div>
  );
}
