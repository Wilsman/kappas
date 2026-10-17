import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Prestige } from "@/types";

const SPARKS = 14;
const DURATION_MS = 2600;

interface PrestigeCelebrationProps {
  /** The prestige just reached, or null when nothing is showing. */
  prestige: Prestige | null;
  onDone: () => void;
}

/** Short overlay played after moving up a prestige. Click anywhere to skip. */
export function PrestigeCelebration({
  prestige,
  onDone,
}: PrestigeCelebrationProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!prestige) return;
    const timer = window.setTimeout(onDone, DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [prestige, onDone]);

  return (
    <AnimatePresence>
      {prestige && (
        <motion.div
          key={prestige.id}
          role="status"
          aria-live="polite"
          onClick={onDone}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-background/70 backdrop-blur-sm"
        >
          <div className="relative flex flex-col items-center">
            {!reduceMotion && (
              <>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 flex h-28 items-center justify-center"
                >
                  {[0, 0.25].map((delay) => (
                    <motion.span
                      key={delay}
                      className="absolute size-28 rounded-full border border-amber-400/60"
                      initial={{ scale: 0.6, opacity: 0.8 }}
                      animate={{ scale: 2.6, opacity: 0 }}
                      transition={{ duration: 1.4, delay, ease: "easeOut" }}
                    />
                  ))}
                </div>
                {Array.from({ length: SPARKS }, (_, i) => {
                  const angle = (i / SPARKS) * Math.PI * 2;
                  const distance = 110 + (i % 3) * 22;
                  return (
                    <motion.span
                      key={i}
                      aria-hidden
                      className="absolute left-1/2 top-14 size-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                      initial={{ x: -3, y: -3, opacity: 0, scale: 0.4 }}
                      animate={{
                        x: Math.cos(angle) * distance - 3,
                        y: Math.sin(angle) * distance - 3,
                        opacity: [0, 1, 0],
                        scale: [0.4, 1, 0.6],
                      }}
                      transition={{
                        duration: 1.1,
                        delay: 0.15 + (i % 4) * 0.04,
                        ease: "easeOut",
                      }}
                    />
                  );
                })}
              </>
            )}

            <motion.div
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.4, rotate: -12 }
              }
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="relative flex size-28 items-center justify-center"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-amber-500/25 blur-2xl"
              />
              {prestige.iconLink && (
                <img
                  src={prestige.iconLink}
                  alt=""
                  className="relative size-28 object-contain drop-shadow-[0_0_24px_rgba(245,158,11,0.6)]"
                />
              )}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.35, duration: 0.3 }}
              className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400"
            >
              Prestige reached
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.45, duration: 0.3 }}
              className="mt-1 text-3xl font-bold uppercase tracking-[0.08em] text-foreground"
            >
              {prestige.name}
            </motion.h2>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
