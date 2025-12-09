import { motion } from "motion/react";
import { Gamepad2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SplashSceneProps {
  onVideoEnd: () => void;
}

type Phase = "text" | "video" | "fadeOut";

export function SplashScene({ onVideoEnd }: SplashSceneProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("text");
  const [textOpacity, setTextOpacity] = useState(0);
  const [videoOpacity, setVideoOpacity] = useState(0);

  useEffect(() => {
    // Preload the video on component mount to make it load fast
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, []);

  useEffect(() => {
    if (phase === "text") {
      // Fade in text
      setTextOpacity(1);
      // Wait 2 seconds, then fade out text
      const timer = setTimeout(() => {
        setTextOpacity(0);
        // After fade out, switch to video phase
        setTimeout(() => {
          setPhase("video");
        }, 500); // Fade out duration
      }, 2000);
      return () => clearTimeout(timer);
    } else if (phase === "video") {
      // Fade in video
      setVideoOpacity(1);
      const video = videoRef.current;
      if (!video) return;

      const handleVideoEnd = () => {
        // Fade out video
        setVideoOpacity(0);
        setPhase("fadeOut");
        // After fade out, transition to startScene
        setTimeout(() => {
          onVideoEnd();
        }, 500);
      };

      video.addEventListener("ended", handleVideoEnd);

      // Start playing the video
      video.play().catch((error) => {
        console.error("Error playing splash video:", error);
        // Fallback: transition after 5 seconds if video fails
        setTimeout(() => {
          setVideoOpacity(0);
          setPhase("fadeOut");
          setTimeout(() => {
            onVideoEnd();
          }, 500);
        }, 5000);
      });

      return () => {
        video.removeEventListener("ended", handleVideoEnd);
      };
    }
  }, [phase, onVideoEnd]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
    >
      {/* Video Background */}
      <motion.video
        ref={videoRef}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 h-screen w-auto object-contain"
        muted
        playsInline
        preload="auto"
        animate={{ opacity: videoOpacity }}
      >
        <source src="/assets/splashScene.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </motion.video>

      {/* Text Overlay at Bottom */}
      <motion.div
        animate={{ opacity: textOpacity }}
        transition={{ duration: 0.5 }}
        className="absolute bottom-8 left-0 right-0 text-center px-4"
      >
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
            className="text-xl md:text-3xl tracking-wider uppercase"
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
            className="text-xl md:text-3xl tracking-wider uppercase"
            style={{
              color: "#00d4ff",
              textShadow:
                "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #0099ff",
              fontWeight: 900,
            }}
          >
            Journey <br />
            <br />
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
            className="text-xl md:text-3xl tracking-wider uppercase"
            style={{
              color: "#00d4ff",
              textShadow:
                "0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, 0 0 40px #0099ff",
              fontWeight: 900,
            }}
          >
            {" "}
            Created by
            <br />
            Md Mahabub
            <br />
            in collaboration <br />
            with
            <br />
            Lumariom Game
            <br />
            Studios
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
      </motion.div>
    </motion.div>
  );
}
