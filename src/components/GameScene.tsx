import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import { Level } from "../App";
import { PauseMenu } from "./PauseMenu";
import { soundManager } from "../utils/sound";

interface GameSceneProps {
  level: Level;
  onGameOver: (score: number, won: boolean) => void;
  onReturnToLevelSelection: () => void;
  onReturnToMainMenu: () => void;
  onRestartCurrentLevel: () => void;
  restartTrigger?: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  maxHits: number;
  color: string;
}

// Vibrant neon color palette
const NEON_COLORS = [
  "#00d4ff", // Cyan
  "#ff00ff", // Magenta
  "#00ff88", // Green
  "#ffaa00", // Orange
  "#ff0066", // Pink
  "#aa00ff", // Purple
  "#ffff00", // Yellow
  "#00ffff", // Aqua
];

// Powerup types
const POWERUP_TYPES = {
  PERM_DAMAGE: "perm_damage",
  TEMP_DAMAGE: "temp_damage",
  DEBUFF_DAMAGE: "debuff_damage",
  PADDLE_SHRINK: "paddle_shrink",
  PADDLE_GROW: "paddle_grow",
  EXTRA_LIFE: "extra_life",
  SHIELD: "shield",
  FAST_BALL: "fast_ball",
  SECOND_BALL: "second_ball",
  DOUBLE_POINTS: "double_points",
} as const;

type PowerupType = (typeof POWERUP_TYPES)[keyof typeof POWERUP_TYPES];

interface Powerup {
  x: number;
  y: number;
  type: PowerupType;
  speed: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Boss {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  shape: string;
  moveTimer: number;
  directionX: number;
  directionY: number;
}

interface Fireball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

export function GameScene({
  level,
  onGameOver,
  onReturnToLevelSelection,
  onReturnToMainMenu,
  onRestartCurrentLevel,
  restartTrigger,
}: GameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [waitingForClick, setWaitingForClick] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [doublePointsActive, setDoublePointsActive] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Game state refs
  const gameStateRef = useRef({
    paddle: { x: 0, y: 0, width: 168, height: 25, speed: 8 }, // Further increased paddle width
    balls: [{ x: 0, y: 0, dx: 0, dy: 0, radius: 10 }] as Ball[],
    bricks: [] as Brick[],
    powerups: [] as Powerup[],
    boss: null as Boss | null,
    bossActive: false,
    bossDestructionTimer: 0, // Timer for boss destruction animation
    smallBoss: null as {
      x: number;
      y: number;
      direction: number; // 1 for right, -1 for left
      speed: number;
      active: boolean;
      spawned: boolean; // To ensure only once per level
    } | null,
    bossExplosionParticles: [] as {
      x: number;
      y: number;
      dx: number;
      dy: number;
      color: string;
      life: number;
      size: number;
      type: "fire" | "debris" | "shockwave";
    }[],
    fireballs: [] as Fireball[],
    keys: { left: false, right: false },
    mouseX: 0,
    score: 0,
    lives: 3,
    isRunning: true,
    isPaused: false,
    waitingForLaunch: true,
    isCrossed: false,
    // Powerup effects
    damageBonus: 0, // Permanent +1 damage (stacks)
    tempDamage: 0, // Temporary damage modifier
    tempDamageTimer: 0, // Frames remaining for temp damage
    debuffDamage: 0, // Debuff damage flag (prevents damage when active)
    debuffDamageTimer: 0, // Frames remaining for debuff damage
    paddleSizeMultiplier: 1, // Paddle size modifier
    paddleSizeTimer: 0, // Frames remaining for paddle size
    ballSpeedMultiplier: 1, // Ball speed modifier
    ballSpeedTimer: 0, // Frames remaining for ball speed
    timeSpeedMultiplier: 1, // Time-based speed increase
    timeElapsed: 0, // Frames elapsed for time-based speed increase
    shieldActive: false, // Shield for one round
    shieldTimer: 0, // Frames remaining for shield
    doublePointsActive: false, // Double points powerup
    doublePointsTimer: 0, // Frames remaining for double points
    ballColor: "#00d4ff", // Current ball color (changes with damage powerups)
    paddleColor: "#00d4ff", // Current paddle color (changes with size powerups)
    particles: [] as {
      x: number;
      y: number;
      dx: number;
      dy: number;
      color: string;
      life: number;
    }[],
    // Brick movement state for every 5th level
    brickVerticalOffset: 0, // Cumulative downward movement
    lastDownTime: 0, // Last time bricks moved down
  });

  useEffect(() => {
    // Delay to show entrance animation
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Effect to handle restart
  useEffect(() => {
    if (restartTrigger !== undefined) {
      // Reset game state for restart
      setScore(0);
      setLives(3);
      setIsReady(false);
      setWaitingForClick(true);
      setIsPaused(false);
      setDoublePointsActive(false);
      // The game loop will reinitialize when isReady becomes true again
      const timer = setTimeout(() => setIsReady(true), 500);
      return () => clearTimeout(timer);
    }
  }, [restartTrigger]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsive canvas size - scale to fit screen while maintaining aspect ratio
    const container = canvas.parentElement;
    const maxWidth = Math.min(window.innerWidth - 32, 960); // Max width with padding
    const maxHeight = Math.min(window.innerHeight - 100, 1080); // Increased height for mobile
    const aspectRatio = 800 / 1300;

    let canvasWidth = maxWidth;
    let canvasHeight = canvasWidth / aspectRatio;

    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight;
      canvasWidth = canvasHeight * aspectRatio;
    }

    canvas.width = 800; // Internal resolution
    canvas.height = 1200; // Increased height
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const state = gameStateRef.current;

    // Initialize paddle
    state.paddle.x = canvas.width / 2 - state.paddle.width / 2 + 5;
    state.paddle.y = canvas.height - 200;

    // Initialize ball (not moving yet)
    state.balls = [
      { x: canvas.width / 2, y: canvas.height - 60, dx: 0, dy: 0, radius: 15 }, // Further increased ball radius
    ];
    state.waitingForLaunch = true;

    // Reset powerup effects
    state.damageBonus = 0;
    state.tempDamage = 0;
    state.tempDamageTimer = 0;
    state.paddleSizeMultiplier = 1;
    state.paddleSizeTimer = 0;
    state.ballSpeedMultiplier = 1;
    state.ballSpeedTimer = 0;
    state.timeSpeedMultiplier = 1;
    state.timeElapsed = 0;
    state.shieldActive = false;
    state.shieldTimer = 0;
    state.doublePointsActive = false;
    state.doublePointsTimer = 0;
    state.ballColor = "#00d4ff"; // Reset to default cyan
    state.paddleColor = "#00d4ff"; // Reset to default cyan
    state.powerups = [];
    state.boss = null;
    state.bossActive = false;
    state.bossExplosionParticles = [];
    state.fireballs = [];
    state.smallBoss = null;

    // Reset brick movement state
    state.brickVerticalOffset = 0;
    state.lastDownTime = 0;

    // Initialize bricks with colorful neon colors - doubled rows for mobile
    const brickWidth = (canvas.width - 70) / level.columns - 10;
    const brickHeight = 45; // Increased brick height
    const brickPadding = 10;
    const brickOffsetTop = 50;
    const brickOffsetLeft = 40;

    // Determine available colors based on level with specific progression
    let levelColors;
    if (level.id <= 5) {
      // Levels 1-5: Only neon sky blue
      levelColors = ["#00d4ff"];
    } else if (level.id <= 10) {
      // Levels 6-10: Neon sky blue and magenta, alternating every 2 lines
      levelColors = ["#00d4ff", "#ff00ff"];
    } else if (level.id <= 15) {
      // Levels 11-15: Three colors including neon sky blue
      levelColors = ["#00d4ff", "#ff00ff", "#ffff00"];
    } else if (level.id <= 20) {
      // Levels 16-20: Four colors including neon sky blue
      levelColors = ["#00d4ff", "#ff00ff", "#ffff00", "#aa00ff"];
    } else if (level.id <= 25) {
      // Levels 21-25: Only neon green
      levelColors = ["#00ff88"];
    } else if (level.id <= 30) {
      // Levels 26-30: Two colors including neon green
      levelColors = ["#00ff88", "#ffaa00"];
    } else if (level.id <= 35) {
      // Levels 31-35: Three colors including neon green
      levelColors = ["#00ff88", "#ffaa00", "#aa00ff"];
    } else if (level.id <= 40) {
      // Levels 36-40: Four colors including neon green
      levelColors = ["#00ff88", "#ffaa00", "#aa00ff", "#ff00ff"];
    } else if (level.id <= 45) {
      // Levels 41-45: Only orange
      levelColors = ["#ffaa00"];
    } else if (level.id <= 50) {
      // Levels 46-50: Two colors including orange
      levelColors = ["#ffaa00", "#aa00ff"];
    } else if (level.id <= 55) {
      // Levels 51-55: Three colors including orange
      levelColors = ["#ffaa00", "#aa00ff", "#ffff00"];
    } else if (level.id <= 60) {
      // Levels 56-60: Four colors including orange
      levelColors = ["#ffaa00", "#aa00ff", "#ffff00", "#ff00ff"];
    } else if (level.id <= 65) {
      // Levels 61-65: Only pink
      levelColors = ["#ff0066"];
    } else if (level.id <= 70) {
      // Levels 66-70: Two colors including pink
      levelColors = ["#ff0066", "#aa00ff"];
    } else if (level.id <= 75) {
      // Levels 71-75: Three colors including pink
      levelColors = ["#ff0066", "#aa00ff", "#00ff88"];
    } else {
      // Levels 76-80: Four colors including pink
      levelColors = ["#ff0066", "#aa00ff", "#00ff88", "#ff00ff"];
    }

    state.bricks = [];
    const totalRows = Math.floor(level.rows * 1.5); // 1.5 times the brick lines
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < level.columns; col++) {
        // Vary hits based on row and level difficulty
        const maxHits = Math.min(Math.floor(row / 2) + 1, level.maxBrickHits);
        // Assign color based on every two lines, cycling through level-appropriate colors
        const colorIndex = Math.floor(row / 2) % levelColors.length;
        const color = levelColors[colorIndex];

        state.bricks.push({
          x: col * (brickWidth + brickPadding) + brickOffsetLeft,
          y: row * (brickHeight + brickPadding) + brickOffsetTop,
          width: brickWidth,
          height: brickHeight,
          hits: maxHits,
          maxHits,
          color,
        });
      }
    }

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        state.isPaused = !state.isPaused;
        setIsPaused(state.isPaused);
      }
      if (e.key === "ArrowLeft") state.keys.left = true;
      if (e.key === "ArrowRight") state.keys.right = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") state.keys.left = false;
      if (e.key === "ArrowRight") state.keys.right = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      state.mouseX = (e.clientX - rect.left) * scaleX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = canvas.width / rect.width;
      state.mouseX = (touch.clientX - rect.left) * scaleX;
    };

    const handleClick = () => {
      if (state.waitingForLaunch && !state.isPaused) {
        // Launch the first ball straight up
        state.balls[0].dx = 0;
        state.balls[0].dy = -level.ballSpeed;

        // If there's a second ball waiting, launch it straight up too
        if (
          state.balls.length > 1 &&
          state.balls[1].dx === 0 &&
          state.balls[1].dy === 0
        ) {
          state.balls[1].dx = 0;
          state.balls[1].dy = -level.ballSpeed;
        }

        state.waitingForLaunch = false;
        setWaitingForClick(false);
        soundManager.playClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault();
        handleClick();
      },
      { passive: false }
    );

    // Game loop
    const gameLoop = () => {
      if (!state.isRunning || state.isPaused) {
        if (state.isRunning && state.isPaused) {
          // Continue requesting frames while paused to resume smoothly
          animationFrameRef.current = requestAnimationFrame(gameLoop);
        }
        return;
      }

      // Clear canvas
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate effective paddle dimensions
      const effectiveWidth = state.paddle.width * state.paddleSizeMultiplier;
      const offset = (state.paddle.width - effectiveWidth) / 2;

      // Move paddle with keyboard
      if (state.keys.left && state.paddle.x > -offset) {
        state.paddle.x -= state.paddle.speed;
      }
      if (
        state.keys.right &&
        state.paddle.x < canvas.width - effectiveWidth - offset
      ) {
        state.paddle.x += state.paddle.speed;
      }

      // Move paddle with mouse
      if (state.mouseX > 0) {
        state.paddle.x = state.mouseX - effectiveWidth / 2;
        state.paddle.x = Math.max(
          -offset,
          Math.min(canvas.width - effectiveWidth - offset, state.paddle.x)
        );
      }

      // If waiting for launch, keep balls above paddle
      if (state.waitingForLaunch) {
        state.balls[0].x = state.paddle.x + state.paddle.width / 2;
        state.balls[0].y = state.paddle.y - state.balls[0].radius - 2;
        // If there's a second ball waiting, keep it at paddle position
        if (
          state.balls.length > 1 &&
          state.balls[1].dx === 0 &&
          state.balls[1].dy === 0
        ) {
          state.balls[1].x = state.paddle.x + state.paddle.width / 2;
          state.balls[1].y = state.paddle.y - state.balls[1].radius - 2;
        }
      }

      // Draw paddle with glow (apply size multiplier and color)
      const paddleWidth = state.paddle.width * state.paddleSizeMultiplier;
      const paddleX = state.paddle.x + (state.paddle.width - paddleWidth) / 2; // Center the paddle
      ctx.shadowBlur = 20;
      ctx.shadowColor = state.paddleColor;
      ctx.fillStyle = state.paddleColor;
      ctx.fillRect(paddleX, state.paddle.y, paddleWidth, state.paddle.height);
      ctx.shadowBlur = 0;

      // Draw shield line below paddle if active
      if (state.shieldActive) {
        ctx.strokeStyle = "#ffaa00"; // Shield color
        ctx.lineWidth = 4.5; // Increased thickness proportionally
        ctx.shadowBlur = 15; // Increased glow
        ctx.shadowColor = "#ffaa00";
        ctx.beginPath();
        ctx.moveTo(0, state.paddle.y + state.paddle.height + 5);
        ctx.lineTo(canvas.width, state.paddle.y + state.paddle.height + 5);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw shield drop effect (flipped in Y direction)
        const dropX = paddleX + paddleWidth / 2;
        const dropY = state.paddle.y + state.paddle.height + 5;
        const dropHeight = 22.5; // Increased height proportionally
        const dropWidth = 30; // Increased width proportionally

        ctx.fillStyle = "#ffaa00";
        ctx.shadowBlur = 15; // Increased glow
        ctx.shadowColor = "#ffaa00";
        ctx.beginPath();
        ctx.ellipse(
          dropX,
          dropY - dropHeight / 2,
          dropWidth / 2,
          dropHeight / 2,
          0,
          0,
          Math.PI
        );
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Move balls (only if launched)
      if (!state.waitingForLaunch) {
        for (let i = state.balls.length - 1; i >= 0; i--) {
          const ball = state.balls[i];
          ball.x +=
            ball.dx * state.ballSpeedMultiplier * state.timeSpeedMultiplier;
          ball.y +=
            ball.dy * state.ballSpeedMultiplier * state.timeSpeedMultiplier;
        }
      }

      // Update boss movement
      if (state.bossActive && state.boss) {
        updateBossMovement(state.boss, canvas.width, canvas.height);
      }

      // Update small boss movement
      if (state.smallBoss && state.smallBoss.active) {
        updateSmallBoss(state.smallBoss, canvas.width);
      }

      // Update brick movement in every 5th level
      if (level.id % 5 === 0) {
        updateBrickMovement(state, canvas.width, canvas.height);
      }

      // Update fireballs
      updateFireballs(state, paddleX, paddleWidth, canvas.height);

      // Update small boss fireballs (spawn fireballs from small boss)
      if (state.smallBoss && state.smallBoss.active) {
        // Spawn fireball every 90 frames (1.5 seconds at 60 FPS)
        if (Math.random() < 0.02) {
          // About every 1.5 seconds on average
          const paddleX = state.paddle.x + state.paddle.width / 2;
          const dx = paddleX - state.smallBoss.x;
          const dy = state.paddle.y - state.smallBoss.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const speed = 2.5;

          state.fireballs.push({
            x: state.smallBoss.x,
            y: state.smallBoss.y,
            dx: (dx / distance) * speed,
            dy: (dy / distance) * speed,
            color: "#ff0000", // Red fireballs from small boss
          });
        }
      }

      // Ball collision with walls and paddle
      for (let i = state.balls.length - 1; i >= 0; i--) {
        const ball = state.balls[i];

        // Wall collisions
        if (ball.x + ball.radius > canvas.width) {
          ball.dx = -Math.abs(ball.dx);
          createParticles(ball.x, ball.y, "#00d4ff");
          soundManager.playWallHit();
        }
        if (ball.x - ball.radius < 0) {
          ball.dx = Math.abs(ball.dx);
          createParticles(ball.x, ball.y, "#00d4ff");
          soundManager.playWallHit();
        }
        if (ball.y - ball.radius < 0) {
          ball.dy = Math.abs(ball.dy);
          createParticles(ball.x, ball.y, "#00d4ff");
          soundManager.playWallHit();
        }

        // Paddle collision (use adjusted paddle position)
        if (ball.y < state.paddle.y + state.paddle.height * 1.5) {
          if (
            ball.y + ball.radius > state.paddle.y &&
            ball.x > paddleX &&
            ball.x < paddleX + paddleWidth &&
            ball.dy > 0
          ) {
            // Change angle based on where ball hits paddle
            const hitPos = (ball.x - paddleX) / paddleWidth;
            const angle = (hitPos - 0.5) * Math.PI * 0.6; // -54 to 54 degrees
            const speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2);
            ball.dx = speed * Math.sin(angle);
            ball.dy = -Math.abs(speed * Math.cos(angle));
            createParticles(ball.x, state.paddle.y, "#00d4ff");
            soundManager.playPaddleHit();
          }
        }

        // Shield collision (if active)
        if (
          state.shieldActive &&
          ball.y + ball.radius > state.paddle.y + state.paddle.height + 5 &&
          ball.y - ball.radius < state.paddle.y + state.paddle.height + 12 && // Increased collision area proportionally
          ball.dy > 0
        ) {
          ball.dy = -ball.dy; // Bounce off shield line
          createParticles(
            ball.x,
            state.paddle.y + state.paddle.height,
            "#ffaa00"
          );
          soundManager.playPaddleHit();
        }
      }

      // Ball falls below paddle (check all balls)
      let ballLost = false;
      for (let i = state.balls.length - 1; i >= 0; i--) {
        const ball = state.balls[i];
        if (!state.waitingForLaunch && ball.y - ball.radius > canvas.height) {
          ballLost = true;
          state.balls.splice(i, 1); // Remove the lost ball
        }
      }

      if (ballLost) {
        ballLost = false;
        // Only lose a life if all balls are lost (when balls.length becomes 0 after removal)
        if (state.balls.length === 0) {
          if (state.shieldActive) {
            state.shieldActive = false; // Use shield
          } else {
            state.lives--;
            setLives(state.lives);
            soundManager.playLoseLife();
          }

          if (state.lives <= 0) {
            state.isRunning = false;
            soundManager.playGameOver();
            onGameOver(state.score, false);
            return;
          }

          // Reset to one ball and wait for click
          state.balls = [
            {
              x: state.paddle.x + state.paddle.width / 2,
              y: state.paddle.y - 10 - 2,
              dx: 0,
              dy: 0,
              radius: 15, // Further increased ball radius
            },
          ];
          state.waitingForLaunch = true;
          setWaitingForClick(true);
        }
        // If there are still balls remaining, don't lose a life
      }

      // Draw balls with glow (use dynamic ball color) - increased glow
      for (const ball of state.balls) {
        ctx.shadowBlur = 22.5; // Increased glow proportionally
        ctx.shadowColor = state.ballColor;
        ctx.fillStyle = state.ballColor;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw boss
      if (state.bossActive && state.boss) {
        drawBoss(ctx, state.boss, state.bossDestructionTimer);
      }

      // Draw small boss
      if (state.smallBoss && state.smallBoss.active) {
        drawSmallBoss(ctx, state.smallBoss);
      }

      // Draw boss explosion particles
      drawBossExplosionParticles(ctx, state);

      // Draw fireballs
      for (const fireball of state.fireballs) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = fireball.color;
        ctx.fillStyle = fireball.color;
        ctx.beginPath();
        ctx.arc(fireball.x, fireball.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw bricks and check collision
      let activeBricks = 0;
      for (let i = state.bricks.length - 1; i >= 0; i--) {
        const brick = state.bricks[i];
        if (brick.hits <= 0) continue;
        activeBricks++;
      }

      // Check ball collisions with bricks
      for (const ball of state.balls) {
        let collidingBricks: Brick[] = [];

        // Find all bricks the ball is colliding with
        for (let i = state.bricks.length - 1; i >= 0; i--) {
          const brick = state.bricks[i];
          if (brick.hits <= 0) continue;

          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
          ) {
            collidingBricks.push(brick);
          }
        }

        // Check ball collision with boss
        if (state.bossActive && state.boss) {
          const bossScale = 1.2;
          const bossHitboxSize = 40 * bossScale; // 48 pixels instead of 40
          if (
            ball.x + ball.radius > state.boss.x - bossHitboxSize &&
            ball.x - ball.radius < state.boss.x + bossHitboxSize &&
            ball.y + ball.radius > state.boss.y - bossHitboxSize &&
            ball.y - ball.radius < state.boss.y + bossHitboxSize
          ) {
            // Ball hit boss
            state.boss.health -= 1 + state.damageBonus + state.tempDamage;
            createParticles(ball.x, ball.y, "#ffaa00");
            soundManager.playBrickHit();

            // Bounce ball away from boss
            if (ball.x < state.boss.x) {
              ball.dx = -Math.abs(ball.dx);
            } else {
              ball.dx = Math.abs(ball.dx);
            }
            if (ball.y < state.boss.y) {
              ball.dy = -Math.abs(ball.dy);
            } else {
              ball.dy = Math.abs(ball.dy);
            }
          }
        }

        // Check ball collision with small boss
        if (state.smallBoss && state.smallBoss.active) {
          const smallBossHitboxSize = 20;
          if (
            ball.x + ball.radius > state.smallBoss.x - smallBossHitboxSize &&
            ball.x - ball.radius < state.smallBoss.x + smallBossHitboxSize &&
            ball.y + ball.radius > state.smallBoss.y - smallBossHitboxSize &&
            ball.y - ball.radius < state.smallBoss.y + smallBossHitboxSize
          ) {
            // Ball hit small boss - award 100 points and remove boss
            state.score += 100;
            setScore(state.score);
            createParticles(
              state.smallBoss.x,
              state.smallBoss.y,
              "#ffaa00",
              15
            );
            soundManager.playBrickBreak();
            state.smallBoss.active = false;
          }
        }

        if (collidingBricks.length > 0) {
          // Determine bounce direction
          if (collidingBricks.length === 1) {
            // Single brick collision - use overlap-based logic
            const brick = collidingBricks[0];
            const ballLeft = ball.x - ball.radius;
            const ballRight = ball.x + ball.radius;
            const ballTop = ball.y - ball.radius;
            const ballBottom = ball.y + ball.radius;

            const brickLeft = brick.x;
            const brickRight = brick.x + brick.width;
            const brickTop = brick.y;
            const brickBottom = brick.y + brick.height;

            const overlapX = Math.min(
              ballRight - brickLeft,
              brickRight - ballLeft
            );
            const overlapY = Math.min(
              ballBottom - brickTop,
              brickBottom - ballTop
            );

            if (overlapX < overlapY) {
              ball.dx = -ball.dx; // Bounce horizontally
            } else {
              ball.dy = -ball.dy; // Bounce vertically
            }
          } else if (collidingBricks.length >= 2) {
            // Multiple brick collision - check ball.y relative to bricks
            const minTop = Math.min(...collidingBricks.map((b) => b.y));
            const maxBottom = Math.max(
              ...collidingBricks.map((b) => b.y + b.height)
            );

            if (ball.y < minTop || ball.y > maxBottom) {
              ball.dy = -ball.dy; // Bounce vertically (above or below both bricks)
            } else {
              ball.dx = -ball.dx; // Bounce horizontally (between bricks vertically)
            }
          }

          // Apply damage to all colliding bricks
          for (const brick of collidingBricks) {
            if (state.debuffDamage > 0) {
              // Debuff damage prevents damage to bricks
              continue;
            }
            brick.hits -= 1 + state.damageBonus + state.tempDamage;

            // Create colorful particles on hit
            createParticles(ball.x, ball.y, brick.color);

            if (brick.hits <= 0) {
              state.score +=
                10 * brick.maxHits * (state.doublePointsActive ? 2 : 1);
              setScore(state.score);
              // Create more particles when brick is destroyed
              // Check if we should spawn small boss (when most bricks are broken)
              const totalBricks = state.bricks.length;
              const bricksRemaining = activeBricks;
              const bricksBroken = totalBricks - bricksRemaining;
              console.log(totalBricks, bricksBroken);
              // Spawn small boss when about 80% of bricks are broken and not already spawned
              if (
                bricksBroken >= totalBricks * 0.7 &&
                (!state.smallBoss || !state.smallBoss.spawned)
              ) {
                spawnSmallBoss(state, canvas.width, canvas.height);
              }

              createParticles(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                brick.color,
                20
              );
              soundManager.playBrickBreak();

              // Spawn powerup (20-30% chance)
              if (Math.random() < 0.25) {
                const powerupTypes = Object.values(POWERUP_TYPES);
                const randomType =
                  powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                state.powerups.push({
                  x: brick.x + brick.width / 2,
                  y: brick.y + brick.height / 2,
                  type: randomType,
                  speed: 2,
                });
              }
            } else {
              soundManager.playBrickHit();
            }
          }
        }
      }

      // Draw bricks
      for (let i = state.bricks.length - 1; i >= 0; i--) {
        const brick = state.bricks[i];
        if (brick.hits <= 0) continue;

        // Draw brick with colorful glow effect - increased glow and border
        const opacity = brick.hits / brick.maxHits;
        ctx.shadowBlur = 22.5 * opacity; // Increased glow proportionally
        ctx.shadowColor = brick.color;

        // Gradient fill for more vibrant look
        const gradient = ctx.createLinearGradient(
          brick.x,
          brick.y,
          brick.x,
          brick.y + brick.height
        );
        gradient.addColorStop(0, brick.color);
        gradient.addColorStop(1, `${brick.color}88`);

        ctx.fillStyle = gradient;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Bright border - increased thickness
        ctx.strokeStyle = brick.color;
        ctx.lineWidth = 3; // Increased border thickness proportionally
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Inner glow - increased size
        ctx.globalAlpha = 0.3 * opacity;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          brick.x + 3, // Increased padding proportionally
          brick.y + 3, // Increased padding proportionally
          brick.width - 6, // Adjusted for increased padding
          brick.height / 2
        );
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;
      }

      // Update and draw particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        if (p.life <= 0) {
          state.particles.splice(i, 1);
          continue;
        }

        const alpha = p.life / 30;
        ctx.shadowBlur = 15; // Increased glow proportionally
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); // Increased particle size proportionally
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Update timers
      if (state.tempDamageTimer > 0) {
        state.tempDamageTimer--;
        if (state.tempDamageTimer <= 0) {
          state.tempDamage = 0;
          state.ballColor = "#00d4ff"; // Reset to default cyan when temp damage ends
        }
      }
      if (state.debuffDamageTimer > 0) {
        state.debuffDamageTimer--;
        if (state.debuffDamageTimer <= 0) {
          state.debuffDamage = 0;
          state.ballColor = "#00d4ff"; // Reset to default cyan when debuff damage ends
        }
      }
      if (state.paddleSizeTimer > 0) {
        state.paddleSizeTimer--;
        if (state.paddleSizeTimer <= 0) {
          state.paddleSizeMultiplier = 1;
          state.paddleColor = "#00d4ff"; // Reset to default cyan when size effect ends
        }
      }
      if (state.ballSpeedTimer > 0) {
        state.ballSpeedTimer--;
        if (state.ballSpeedTimer <= 0) {
          state.ballSpeedMultiplier = 1;
        }
      }
      if (state.shieldTimer > 0) {
        state.shieldTimer--;
        if (state.shieldTimer <= 0) {
          state.shieldActive = false;
        }
      }
      if (state.doublePointsTimer > 0) {
        state.doublePointsTimer--;
        if (state.doublePointsTimer <= 0) {
          state.doublePointsActive = false;
          setDoublePointsActive(false);
        }
      }

      // Update time-based speed increase (every 10 seconds at 60 FPS)
      state.timeElapsed++;
      if (state.timeElapsed % (10 * 60) === 0) {
        if (state.timeSpeedMultiplier < 1.5) {
          state.timeSpeedMultiplier += 0.05; // Increase by 10% every 10 seconds
        }
      }

      // Move and draw powerups
      for (let i = state.powerups.length - 1; i >= 0; i--) {
        const powerup = state.powerups[i];
        powerup.y += powerup.speed;

        // Remove if off screen
        if (powerup.y > canvas.height) {
          state.powerups.splice(i, 1);
          continue;
        }

        // Check paddle collision - increased collision area proportionally
        if (
          powerup.y + 15 > state.paddle.y && // Increased collision height
          powerup.x > paddleX &&
          powerup.x < paddleX + paddleWidth &&
          powerup.y < state.paddle.y + state.paddle.height
        ) {
          // Apply effect
          applyPowerupEffect(state, powerup.type);
          state.powerups.splice(i, 1);
          continue;
        }

        // Draw powerup - further increased size
        ctx.shadowBlur = 22.5; // Further increased glow
        ctx.shadowColor = getPowerupColor(powerup.type);
        ctx.fillStyle = getPowerupColor(powerup.type);

        if (powerup.type === POWERUP_TYPES.PERM_DAMAGE) {
          // Draw red circle with "P" for permanent damage
          ctx.fillStyle = "#ff0000"; // Red
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();

          // Draw "P" text inside
          ctx.fillStyle = "#ffffff"; // White text for contrast
          ctx.font = "bold 20px Arial"; // Further increased font size
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("P", powerup.x, powerup.y);
        } else if (powerup.type === POWERUP_TYPES.TEMP_DAMAGE) {
          // Draw red circle with "T" for temporary damage
          ctx.fillStyle = "#ff0000"; // Red
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();

          // Draw "T" text inside
          ctx.fillStyle = "#ffffff"; // White text for contrast
          ctx.font = "bold 20px Arial"; // Further increased font size
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("T", powerup.x, powerup.y);
        } else if (powerup.type === POWERUP_TYPES.DEBUFF_DAMAGE) {
          // Draw #fe019a circle with "D" for debuff damage
          ctx.fillStyle = "#fe019a"; // Hot pink
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();

          // Draw "D" text inside
          ctx.fillStyle = "#ffffff"; // White text for contrast
          ctx.font = "bold 20px Arial"; // Further increased font size
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("D", powerup.x, powerup.y);
        } else if (powerup.type === POWERUP_TYPES.SECOND_BALL) {
          // Draw green circle same size as ball (radius 18)
          ctx.fillStyle = "#00ff88"; // Neon green
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();
        } else if (powerup.type === POWERUP_TYPES.PADDLE_GROW) {
          // Draw green circle with "<>" for paddle grow
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();

          // Draw "<>" text inside
          ctx.fillStyle = "#000000"; // Black text for contrast
          ctx.font = "bold 20px Arial"; // Further increased font size
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("<>", powerup.x, powerup.y);
        } else if (powerup.type === POWERUP_TYPES.PADDLE_SHRINK) {
          // Draw red circle with "><" for paddle shrink
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();

          // Draw "><" text inside
          ctx.fillStyle = "#ffffff"; // White text for contrast on red
          ctx.font = "bold 20px Arial"; // Further increased font size
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("><", powerup.x, powerup.y);
        } else if (powerup.type === POWERUP_TYPES.EXTRA_LIFE) {
          // Draw neon sky blue heart shape same as lives indicator but larger
          ctx.fillStyle = "#00d4ff"; // Neon sky blue
          const heartSize = 22.5; // Further increased size
          ctx.beginPath();
          ctx.moveTo(powerup.x, powerup.y + heartSize * 0.3);
          ctx.bezierCurveTo(
            powerup.x,
            powerup.y,
            powerup.x - heartSize * 0.6,
            powerup.y,
            powerup.x - heartSize * 0.6,
            powerup.y + heartSize * 0.3
          );
          ctx.bezierCurveTo(
            powerup.x - heartSize * 0.6,
            powerup.y + heartSize * 0.9,
            powerup.x,
            powerup.y + heartSize * 0.9,
            powerup.x,
            powerup.y + heartSize * 0.9
          );
          ctx.bezierCurveTo(
            powerup.x,
            powerup.y + heartSize * 0.9,
            powerup.x + heartSize * 0.6,
            powerup.y + heartSize * 0.9,
            powerup.x + heartSize * 0.6,
            powerup.y + heartSize * 0.3
          );
          ctx.bezierCurveTo(
            powerup.x + heartSize * 0.6,
            powerup.y,
            powerup.x,
            powerup.y,
            powerup.x,
            powerup.y + heartSize * 0.3
          );
          ctx.closePath();
          ctx.fill();
        } else if (powerup.type === POWERUP_TYPES.SHIELD) {
          // Draw neon orange shield shape
          ctx.fillStyle = "#ffaa00"; // Neon orange
          const shieldWidth = 27; // Further increased width
          const shieldHeight = 27; // Further increased height
          ctx.beginPath();
          // Top curve
          ctx.arc(
            powerup.x,
            powerup.y - shieldHeight / 2 + 4,
            shieldWidth / 2,
            Math.PI,
            0,
            false
          );
          // Right side
          ctx.lineTo(
            powerup.x + shieldWidth / 2,
            powerup.y + shieldHeight / 2 - 4
          );
          // Bottom point
          ctx.lineTo(powerup.x, powerup.y + shieldHeight / 2);
          // Left side
          ctx.lineTo(
            powerup.x - shieldWidth / 2,
            powerup.y + shieldHeight / 2 - 4
          );
          ctx.closePath();
          ctx.fill();
        } else if (powerup.type === POWERUP_TYPES.FAST_BALL) {
          // Draw neon yellow lightning bolt (energy icon) - larger
          ctx.fillStyle = "#ffff00"; // Neon yellow
          ctx.beginPath();
          // Lightning bolt shape - further scaled up
          ctx.moveTo(powerup.x - 9, powerup.y - 15); // Top left
          ctx.lineTo(powerup.x + 6, powerup.y - 15); // Top right
          ctx.lineTo(powerup.x - 6, powerup.y); // Middle left
          ctx.lineTo(powerup.x + 9, powerup.y); // Middle right
          ctx.lineTo(powerup.x - 9, powerup.y + 15); // Bottom left
          ctx.lineTo(powerup.x, powerup.y); // Back to middle
          ctx.closePath();
          ctx.fill();
        } else if (powerup.type === POWERUP_TYPES.DOUBLE_POINTS) {
          // Draw red circle with "X2" for double points
          ctx.fillStyle = "#ff0000"; // Red
          ctx.beginPath();
          ctx.arc(powerup.x, powerup.y, 18, 0, Math.PI * 2); // Further increased size
          ctx.fill();

          // Draw "X2" text inside
          ctx.fillStyle = "#ffffff"; // White text for contrast
          ctx.font = "bold 20px Arial"; // Further increased font size
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("X2", powerup.x, powerup.y);
        } else {
          // Default box shape for other powerups
          ctx.fillRect(powerup.x - 13.5, powerup.y - 13.5, 27, 27); // Further increased size
        }

        ctx.shadowBlur = 0;
      }

      // Check win condition
      if (activeBricks === 0) {
        if (level.id % 5 === 0 && !state.bossActive) {
          // Start boss battle for every 5th level
          startBossBattle(state, level);
        } else if (!state.bossActive) {
          state.isRunning = false;
          soundManager.playVictory();
          onGameOver(state.score, true);
          return;
        }
      }

      // Check boss defeat
      if (
        state.bossActive &&
        state.boss &&
        state.boss.health <= 0 &&
        state.bossDestructionTimer === 0
      ) {
        // Create explosion particles
        createBossExplosion(state.boss.x, state.boss.y);
        state.bossDestructionTimer = 120; // 2 second destruction animation at 60 FPS
        soundManager.playVictory();
      }

      // Update boss destruction timer
      if (state.bossDestructionTimer > 0) {
        updateBossExplosionParticles(state);
        state.bossDestructionTimer--;
        if (state.bossDestructionTimer <= 0) {
          state.isRunning = false;
          onGameOver(state.score, true);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    function createParticles(x: number, y: number, color: string, count = 8) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        state.particles.push({
          x,
          y,
          dx: Math.cos(angle) * 2,
          dy: Math.sin(angle) * 2,
          color,
          life: 30,
        });
      }
    }

    function createBossExplosion(x: number, y: number) {
      // Create fire particles spreading outward
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20;
        const speed = 2 + Math.random() * 3;
        state.bossExplosionParticles.push({
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          color: Math.random() > 0.5 ? "#ffaa00" : "#ff6600", // Orange and red
          life: 60 + Math.random() * 30,
          size: 4 + Math.random() * 6,
          type: "fire",
        });
      }

      // Create debris particles
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        state.bossExplosionParticles.push({
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          color: "#8b4513", // Brown debris
          life: 90 + Math.random() * 30,
          size: 2 + Math.random() * 4,
          type: "debris",
        });
      }

      // Create shockwave particles
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 4 + Math.random() * 2;
        state.bossExplosionParticles.push({
          x,
          y,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed,
          color: "#ffff00", // Yellow shockwave
          life: 30 + Math.random() * 20,
          size: 1 + Math.random() * 2,
          type: "shockwave",
        });
      }
    }

    function updateBossExplosionParticles(state: typeof gameStateRef.current) {
      for (let i = state.bossExplosionParticles.length - 1; i >= 0; i--) {
        const p = state.bossExplosionParticles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        // Add gravity to debris
        if (p.type === "debris") {
          p.dy += 0.1;
        }

        // Slow down fire particles
        if (p.type === "fire") {
          p.dx *= 0.98;
          p.dy *= 0.98;
        }

        // Expand shockwave
        if (p.type === "shockwave") {
          p.size += 0.2;
        }

        if (p.life <= 0) {
          state.bossExplosionParticles.splice(i, 1);
        }
      }
    }

    function drawBossExplosionParticles(
      ctx: CanvasRenderingContext2D,
      state: typeof gameStateRef.current
    ) {
      for (const p of state.bossExplosionParticles) {
        const alpha =
          p.life / (p.type === "fire" ? 90 : p.type === "debris" ? 120 : 50);
        ctx.globalAlpha = Math.max(0, alpha);

        if (p.type === "fire") {
          // Draw fire particle with glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (p.type === "debris") {
          // Draw debris particle
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else if (p.type === "shockwave") {
          // Draw shockwave ring
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    function startBossBattle(state: typeof gameStateRef.current, level: Level) {
      const bossShapes = [
        "ant",
        "spider",
        "bee",
        "beetle",
        "butterfly",
        "aphid",
      ];
      const shapeIndex = Math.floor((level.id - 1) / 5) % bossShapes.length;

      state.boss = {
        x: canvas!.width / 2,
        y: 100,
        health: level.id,
        maxHealth: level.id,
        shape: bossShapes[shapeIndex],
        moveTimer: 0,
        directionX: 1,
        directionY: 1,
      };
      state.bossActive = true;
    }

    function updateBossMovement(
      boss: Boss,
      canvasWidth: number,
      canvasHeight: number
    ) {
      boss.moveTimer++;

      // Move left and right
      boss.x += boss.directionX * 2;
      if (boss.x < 50 || boss.x > canvasWidth - 50) {
        boss.directionX *= -1;
      }

      // Move up and down
      boss.y += boss.directionY * 1;
      if (boss.y < 50 || boss.y > 200) {
        boss.directionY *= -1;
      }

      // Spawn fireball every 120 frames (2 seconds at 60 FPS)
      if (boss.moveTimer % 120 === 0) {
        const paddleX = state.paddle.x + state.paddle.width / 2;
        const dx = paddleX - boss.x;
        const dy = state.paddle.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 3;

        state.fireballs.push({
          x: boss.x,
          y: boss.y,
          dx: (dx / distance) * speed,
          dy: (dy / distance) * speed,
          color: "#ffaa00", // Neon orange
        });
      }
    }

    function updateBrickMovement(
      state: typeof gameStateRef.current,
      canvasWidth: number,
      canvasHeight: number
    ) {
      // Simple oscillating movement for every 5th level
      const time = Date.now() * 0.001;
      const horizontalAmplitude = 35;
      const frequencyH = 1.2;
      const horizontalOffset =
        horizontalAmplitude * Math.sin(time * frequencyH);

      // Gradual downward movement
      const verticalOffset = state.brickVerticalOffset;

      // Apply movement to all bricks
      for (const brick of state.bricks) {
        if (brick.hits <= 0) continue;

        // Store original positions if not set
        if (!(brick as any).originalX) {
          (brick as any).originalX = brick.x;
        }

        // Move brick relative to its original position
        brick.x = (brick as any).originalX + horizontalOffset;
        if (!state.waitingForLaunch) {
          if (!(brick as any).originalY) {
            (brick as any).originalY = brick.y;
          }
          brick.y = (brick as any).originalY + verticalOffset * 0.1;
        }
      }

      // Clamp brick positions to stay on screen
      for (const brick of state.bricks) {
        if (brick.hits <= 0) continue;
        brick.x = Math.max(0, Math.min(canvasWidth - brick.width, brick.x));
      }

      // Gradually move bricks down over time (only when playing)
      if (!state.waitingForLaunch) {
        state.brickVerticalOffset += 0.3; // Downward movement
      }

      // Check for brick-paddle collision (game over condition)
      const paddleWidth = state.paddle.width * state.paddleSizeMultiplier;
      const paddleX =
        state.paddle.x + (state.paddle.width - paddleWidth) / 2 + 5;

      for (const brick of state.bricks) {
        if (brick.hits <= 0) continue;

        // Check if brick collides with paddle
        if (
          brick.x + brick.width > paddleX &&
          brick.x < paddleX + paddleWidth &&
          brick.y + brick.height > state.paddle.y &&
          brick.y < state.paddle.y + state.paddle.height
        ) {
          // Brick hit paddle - game over
          state.isRunning = false;
          soundManager.playGameOver();
          onGameOver(state.score, false);
          return;
        }
      }
    }

    function updateFireballs(
      state: typeof gameStateRef.current,
      paddleX: number,
      paddleWidth: number,
      canvasHeight: number
    ) {
      for (let i = state.fireballs.length - 1; i >= 0; i--) {
        const fireball = state.fireballs[i];
        fireball.x += fireball.dx;
        fireball.y += fireball.dy;

        // Remove if off screen
        if (fireball.y > canvasHeight) {
          state.fireballs.splice(i, 1);
          continue;
        }

        // Check collision with paddle
        if (
          fireball.y + 8 > state.paddle.y &&
          fireball.x > paddleX &&
          fireball.x < paddleX + paddleWidth &&
          fireball.y < state.paddle.y + state.paddle.height
        ) {
          // Fireball hit paddle
          state.fireballs.splice(i, 1);
          if (state.shieldActive) {
            state.shieldActive = false;
          } else {
            if (state.bossDestructionTimer == 0) {
              state.lives--;
              setLives(state.lives);
              soundManager.playLoseLife();
            }
          }

          if (state.lives <= 0) {
            state.isRunning = false;
            soundManager.playGameOver();
            onGameOver(state.score, false);
            return;
          }
          continue;
        }
      }
    }

    function updateSmallBoss(
      smallBoss: NonNullable<typeof state.smallBoss>,
      canvasWidth: number
    ) {
      // Move left or right
      smallBoss.x += smallBoss.direction * smallBoss.speed;

      // Remove if off screen (opposite side)
      if (smallBoss.direction === 1 && smallBoss.x > canvasWidth + 50) {
        smallBoss.active = false;
      } else if (smallBoss.direction === -1 && smallBoss.x < -50) {
        smallBoss.active = false;
      }
    }

    function drawSmallBoss(
      ctx: CanvasRenderingContext2D,
      smallBoss: NonNullable<typeof state.smallBoss>
    ) {
      ctx.save();

      // Draw small boss as a red skull-like shape
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff0000";
      ctx.fillStyle = "#ff0000";

      // Main skull shape
      ctx.beginPath();
      ctx.arc(smallBoss.x, smallBoss.y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(smallBoss.x - 5, smallBoss.y - 3, 3, 0, Math.PI * 2);
      ctx.arc(smallBoss.x + 5, smallBoss.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(smallBoss.x - 5, smallBoss.y - 3, 1.5, 0, Math.PI * 2);
      ctx.arc(smallBoss.x + 5, smallBoss.y - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Teeth
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(smallBoss.x - 3, smallBoss.y + 5, 2, 4);
      ctx.fillRect(smallBoss.x + 1, smallBoss.y + 5, 2, 4);

      ctx.restore();
    }

    function spawnSmallBoss(
      state: typeof gameStateRef.current,
      canvasWidth: number,
      canvasHeight: number
    ) {
      // Randomly choose left or right side
      const direction = Math.random() < 0.5 ? 1 : -1; // 1 for right, -1 for left
      const startX = direction === 1 ? -30 : canvasWidth + 30; // Start off-screen
      const y = canvasHeight * 0.3 + Math.random() * (canvasHeight * 0.4); // Random Y position in middle area

      state.smallBoss = {
        x: startX,
        y: y,
        direction: direction,
        speed: 2 + Math.random() * 1, // Speed between 2-3
        active: true,
        spawned: true,
      };
    }

    function drawBoss(
      ctx: CanvasRenderingContext2D,
      boss: Boss,
      destructionTimer: number = 0
    ) {
      ctx.save();
      ctx.translate(boss.x, boss.y);

      // Apply destruction animation effect
      let alpha = 1;
      let scale = 1.2; // 20% bigger
      if (destructionTimer > 0) {
        const progress = (120 - destructionTimer) / 120; // 0 to 1 over 2 seconds
        alpha = Math.max(0, 1 - progress * 2); // Fade out over first half
        scale = 1.2 + progress * 1; // Scale up slightly more during destruction
        ctx.globalAlpha = alpha;
      }

      // Draw boss shape based on type
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ffaa00";
      ctx.strokeStyle = "#ffaa00";
      ctx.lineWidth = 3;

      // Apply scale transformation (always 20% bigger, plus destruction effect)
      ctx.scale(scale, scale);

      switch (boss.shape) {
        case "ant":
          // Draw skull shape (danger symbol)
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(0, -10, 25, 0, Math.PI * 2); // skull head
          ctx.fill();
          ctx.stroke();

          // Eye sockets
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(-8, -15, 4, 0, Math.PI * 2);
          ctx.arc(8, -15, 4, 0, Math.PI * 2);
          ctx.fill();

          // Nasal cavity
          ctx.beginPath();
          ctx.arc(0, -5, 3, 0, Math.PI * 2);
          ctx.fill();

          // Teeth
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-6, 0, 3, 8);
          ctx.fillRect(3, 0, 3, 8);
          ctx.fillRect(-12, 0, 3, 6);
          ctx.fillRect(9, 0, 3, 6);
          break;

        case "spider":
          // Draw web/cross shape
          ctx.strokeStyle = "#ffaa00";
          ctx.lineWidth = 4;

          // Cross lines
          ctx.beginPath();
          ctx.moveTo(-30, 0);
          ctx.lineTo(30, 0);
          ctx.moveTo(0, -30);
          ctx.lineTo(0, 30);
          ctx.stroke();

          // Diagonal lines
          ctx.beginPath();
          ctx.moveTo(-21, -21);
          ctx.lineTo(21, 21);
          ctx.moveTo(21, -21);
          ctx.lineTo(-21, 21);
          ctx.stroke();

          // Center circle
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case "bee":
          // Draw gear/hexagon shape
          ctx.fillStyle = "#ffff00";
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Gear teeth
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 3;
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x1 = Math.cos(angle) * 25;
            const y1 = Math.sin(angle) * 25;
            const x2 = Math.cos(angle) * 35;
            const y2 = Math.sin(angle) * 35;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.strokeStyle = "#ffaa00";
          ctx.lineWidth = 3;
          break;

        case "beetle":
          // Draw diamond shape
          ctx.fillStyle = "#8b4513";
          ctx.beginPath();
          ctx.moveTo(0, -35);
          ctx.lineTo(25, 0);
          ctx.lineTo(0, 35);
          ctx.lineTo(-25, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Inner diamond
          ctx.fillStyle = "#654321";
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(15, 0);
          ctx.lineTo(0, 20);
          ctx.lineTo(-15, 0);
          ctx.closePath();
          ctx.fill();
          break;

        case "butterfly":
          // Draw flower/star shape
          ctx.fillStyle = "#ff69b4";
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Center circle
          ctx.fillStyle = "#ffff00";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          break;

        case "aphid":
          // Draw droplet/leaf shape
          ctx.fillStyle = "#32cd32";
          ctx.beginPath();
          ctx.arc(0, -15, 20, 0, Math.PI * 2); // top circle
          ctx.arc(0, 15, 25, Math.PI, 0, true); // bottom half-circle
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Stem
          ctx.strokeStyle = "#228b22";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 35);
          ctx.lineTo(0, 50);
          ctx.stroke();
          ctx.strokeStyle = "#ffaa00";
          ctx.lineWidth = 3;
          break;

        default:
          // Default rectangle shape if shape not recognized
          ctx.fillStyle = "#ffaa00";
          ctx.fillRect(-30, -20, 60, 40);
          ctx.strokeRect(-30, -20, 60, 40);
          break;
      }

      ctx.restore();

      // Draw health bar only if not in destruction animation
      if (destructionTimer === 0) {
        const barWidth = 120; // Scaled proportionally (100 * 1.2)
        const barHeight = 10;
        const barX = boss.x - barWidth / 2;
        const barY = boss.y - 60;

        // Background
        ctx.fillStyle = "#333333";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthPercent = boss.health / boss.maxHealth;
        ctx.fillStyle =
          healthPercent > 0.5
            ? "#00ff00"
            : healthPercent > 0.25
            ? "#ffff00"
            : "#ff0000";
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
      }
    }

    function applyPowerupEffect(
      state: typeof gameStateRef.current,
      type: PowerupType
    ) {
      const fps = 60; // Assuming 60 FPS
      switch (type) {
        case POWERUP_TYPES.PERM_DAMAGE:
          state.damageBonus++;
          state.ballColor = "#fe0131"; // Dark red for permanent damage
          break;
        case POWERUP_TYPES.TEMP_DAMAGE:
          // Deactivate PERM_DAMAGE if active
          if (state.damageBonus > 0) {
            state.damageBonus = 0;
            state.ballColor = "#00d4ff"; // Reset to default cyan
          }
          state.tempDamage = 1; // High damage to break bricks in one hit
          state.tempDamageTimer = 20 * fps; // 20 seconds
          state.ballColor = "#fe3b01"; // Orange-red for temp damage
          break;
        case POWERUP_TYPES.PADDLE_SHRINK:
          state.paddleSizeMultiplier = 0.8;
          state.paddleSizeTimer = 10 * fps; // 10 seconds
          state.paddleColor = "#019afe"; // Blue for shrink
          break;
        case POWERUP_TYPES.PADDLE_GROW:
          state.paddleSizeMultiplier = 1.3;
          state.paddleSizeTimer = 20 * fps; // 20 seconds
          state.paddleColor = "#01fe65"; // Green for grow
          break;
        case POWERUP_TYPES.EXTRA_LIFE:
          if (state.lives < 3) {
            state.lives++;
            setLives(state.lives);
          }
          break;
        case POWERUP_TYPES.SHIELD:
          state.shieldActive = true;
          state.shieldTimer = 20 * fps; // 20 seconds
          break;
        case POWERUP_TYPES.FAST_BALL:
          state.ballSpeedMultiplier = 1.5;
          state.ballSpeedTimer = 10 * fps; // 10 seconds
          break;
        case POWERUP_TYPES.SECOND_BALL:
          if (state.balls.length < 2) {
            const firstBall = state.balls[0];
            if (firstBall.dx === 0 && firstBall.dy === 0) {
              // First ball not launched yet, create second ball at paddle position
              state.balls.push({
                x: state.paddle.x + state.paddle.width / 2,
                y: state.paddle.y - 10 - 2,
                dx: 0, // Will be set when first ball launches
                dy: 0,
                radius: 15, // Further increased ball radius
              });
            } else {
              // First ball already launched, create second ball at paddle and launch straight up
              state.balls.push({
                x: state.paddle.x + state.paddle.width / 2,
                y: state.paddle.y - 10 - 2,
                dx: 0, // Straight up
                dy: -level.ballSpeed,
                radius: 15, // Further increased ball radius
              });
            }
          }
          break;
        case POWERUP_TYPES.DEBUFF_DAMAGE:
          state.debuffDamage = 1; // Activate debuff damage
          state.debuffDamageTimer = 15 * fps; // 15 seconds
          state.ballColor = "#fe019a"; // Hot pink for debuff damage
          break;
        case POWERUP_TYPES.DOUBLE_POINTS:
          state.doublePointsActive = true;
          state.doublePointsTimer = 15 * fps; // 15 seconds
          setDoublePointsActive(true);
          break;
      }
    }

    function getPowerupColor(type: PowerupType): string {
      switch (type) {
        case POWERUP_TYPES.PERM_DAMAGE:
          return "#ff0066"; // Pink
        case POWERUP_TYPES.TEMP_DAMAGE:
          return "#ffaa00"; // Orange
        case POWERUP_TYPES.DEBUFF_DAMAGE:
          return "#8b0000"; // Dark red
        case POWERUP_TYPES.PADDLE_SHRINK:
          return "#ff4500"; // Red-orange
        case POWERUP_TYPES.PADDLE_GROW:
          return "#32cd32"; // Lime green
        case POWERUP_TYPES.EXTRA_LIFE:
          return "#ff1493"; // Deep pink
        case POWERUP_TYPES.SHIELD:
          return "#00ffff"; // Cyan
        case POWERUP_TYPES.FAST_BALL:
          return "#ffff00"; // Yellow
        case POWERUP_TYPES.SECOND_BALL:
          return "#daa520"; // Goldenrod
        case POWERUP_TYPES.DOUBLE_POINTS:
          return "#ff0000"; // Red
        default:
          return "#ffffff";
      }
    }

    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [level, onGameOver, isReady]);

  const handlePauseToggle = () => {
    const newPauseState = !isPaused;
    gameStateRef.current.isPaused = newPauseState;
    setIsPaused(newPauseState);
  };

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

  const handleRestartLevel = () => {
    setIsPaused(false);
    onRestartCurrentLevel();
  };

  const handleLevels = () => {
    onReturnToLevelSelection();
  };

  const handleMainMenu = () => {
    onReturnToMainMenu();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 p-8 relative"
    >
      {/* Lives, Score, and Controls */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex  sm:flex-row items-end justify-between w-full max-w-[800px] gap-4"
      >
        {/* Lives */}
        <div className="flex">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.3 + i * 0.1,
                type: "spring",
                stiffness: 200,
              }}
            >
              <Heart
                className="w-8 h-8"
                style={{
                  color: i < lives ? "#00d4ff" : "#1f2937",
                  fill: i < lives ? "#00d4ff" : "transparent",
                  filter: i < lives ? "drop-shadow(0 0 8px #00d4ff)" : "none",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Score */}
        <div
          className="px-4 py-2 rounded-lg text-center relative"
          style={{
            backgroundColor: "rgba(0, 212, 255, 0.1)",
            border: "2px solid #00d4ff",
            boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
          }}
        >
          <div className="text-sm" style={{ color: "#00d4ff" }}>
            SCORE
          </div>
          <motion.div
            key={score}
            initial={{ scale: 1.5 }}
            animate={{ scale: 1 }}
            className="text-xl"
            style={{
              color: "#00d4ff",
              textShadow: "0 0 10px #00d4ff",
            }}
          >
            {score}
          </motion.div>
          {/* X2 Indicator */}
          <AnimatePresence>
            {doublePointsActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="absolute -top-2 -right-2 px-2  rounded-md text-sm font-bold"
                style={{
                  marginLeft: "5px",
                  backgroundColor: "#ff0000",
                  color: "#ffffff",
                  boxShadow: "0 0 15px rgba(255, 0, 0, 0.6)",
                  border: "2px solid #ffffff",
                }}
              >
                X2
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Sound Toggle */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
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

          {/* Pause Button */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePauseToggle}
            className="p-2 rounded-lg transition-all"
            style={{
              backgroundColor: "rgba(0, 212, 255, 0.1)",
              border: "2px solid #00d4ff",
              boxShadow: "0 0 15px rgba(0, 212, 255, 0.3)",
            }}
          >
            <Pause className="w-5 h-5" style={{ color: "#00d4ff" }} />
          </motion.button>
        </div>
      </motion.div>

      {/* Game Canvas */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.4,
          duration: 0.6,
          type: "spring",
          stiffness: 100,
        }}
        className="relative"
      >
        <canvas
          ref={canvasRef}
          className="rounded-lg cursor-pointer"
          style={{
            border: "3px solid #00d4ff",
            boxShadow:
              "0 0 30px rgba(0, 212, 255, 0.4), inset 0 0 30px rgba(0, 212, 255, 0.1)",
          }}
        />

        {/* Click to Start Indicator */}
        {waitingForClick && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: "rgba(0, 212, 255, 0.2)",
                border: "2px solid #00d4ff",
                boxShadow: "0 0 30px rgba(0, 212, 255, 0.6)",
              }}
            >
              <div
                className="text-m uppercase tracking-widest"
                style={{
                  color: "#00d4ff",
                  textShadow: "0 0 10px #00d4ff",
                  fontWeight: 700,
                }}
              >
                Click to Launch
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-center text-s sm:text-sm px-4"
        style={{ color: "#80e7ff" }}
      >
        <div className="hidden sm:block"></div>
        <div className="sm:hidden">
          Tap to launch ball <br />
          Touch and drag to move the paddle
        </div>
      </motion.div>

      {/* Pause Menu */}
      <AnimatePresence>
        {isPaused && (
          <PauseMenu
            onResume={handlePauseToggle}
            onRestart={handleRestartLevel}
            onMainMenu={handleMainMenu}
            onLevels={handleLevels}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
