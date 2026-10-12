"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Avatar, Card, ProgressBar } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import {
  Heart,
  ArrowRight,
  Award,
  Gift,
  Star,
  Trophy,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

import { getUserAvatarUrl } from "@/src/services/userService";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import getProjectFunding from "@/src/helpers/getProjectFunding";
import getFundingAmount from "@/src/helpers/getFundingAmount";
import { IProjectFunding } from "@/src/models/project-funding";

// Impact badge and rank for a donation amount (pure, derived from the URL param)
function getImpact(amount: string): { badge: string; rank: number } {
  const amountNum = parseInt(amount);

  if (amountNum >= 50000) return { badge: "Չեմպիոն", rank: 1 };
  if (amountNum >= 20000) return { badge: "Հերոս", rank: 2 };
  if (amountNum >= 10000) return { badge: "Փոփոխության կրող", rank: 3 };
  if (amountNum >= 5000) return { badge: "Աջակից", rank: 4 };

  return { badge: "Ընկեր", rank: 5 };
}

function subscribeToResize(onChange: () => void) {
  window.addEventListener("resize", onChange);

  return () => window.removeEventListener("resize", onChange);
}

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "5000";
  const projectName = searchParams.get("project") || "նախագծին";
  const projectSlug = searchParams.get("slug") || "";

  const [showConfetti, setShowConfetti] = useState(true);
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [funding, setFunding] = useState<IProjectFunding | null>(null);
  const [animatedRaised, setAnimatedRaised] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { badge: impactBadge, rank: donationRank } = getImpact(amount);

  // Window dimensions for confetti positioning (0 on the server, live on the client)
  const dimensions = {
    width: useSyncExternalStore(
      subscribeToResize,
      () => window.innerWidth,
      () => 0,
    ),
    height: useSyncExternalStore(
      subscribeToResize,
      () => window.innerHeight,
      () => 0,
    ),
  };

  // Fetch user avatar and project data
  useEffect(() => {
    async function loadData() {
      const url = await getUserAvatarUrl();

      setAvatarUrl(url);

      // Fetch project data if slug is available
      if (projectSlug) {
        const { data }: { data: IProject[] } = await getData({
          type: "projects",
          filters: { slug: projectSlug },
          fields: ["name", "documentId", "donationType"],
        });

        if (data && data.length > 0) {
          const projectData = data[0];

          setProject(projectData);

          // Fetch dynamic funding data
          if (projectData.documentId) {
            const fundingData = await getProjectFunding(projectData.documentId);

            setFunding(fundingData);
          }
        }
      }
    }
    loadData();
  }, [projectSlug]);

  // Play success sound and show animations in sequence
  useEffect(() => {
    // Create audio element for success sound
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/success-sound.mp3");
      audioRef.current.volume = 0.5;
      audioRef.current
        .play()
        .catch((e) => console.log("Audio play failed:", e));
    }

    // Show badge animation after 1.5 seconds
    const badgeTimer = setTimeout(() => {
      setShowBadgeAnimation(true);
    }, 1500);

    // Show thank you message after 3 seconds
    const messageTimer = setTimeout(() => {
      setShowThankYouMessage(true);
    }, 3000);

    return () => {
      clearTimeout(badgeTimer);
      clearTimeout(messageTimer);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Animate progress bar when funding data loads
  useEffect(() => {
    if (funding) {
      // Get gathered amount based on project type
      const gatheredAmount = getFundingAmount(funding);

      if (gatheredAmount > 0) {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = gatheredAmount / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          setAnimatedRaised(Math.min(increment * currentStep, gatheredAmount));

          if (currentStep >= steps) {
            clearInterval(interval);
          }
        }, duration / steps);

        return () => clearInterval(interval);
      }
    }
  }, [funding]);

  // Get badge icon based on impact level
  const getBadgeIcon = () => {
    switch (donationRank) {
      case 1:
        return <Trophy className="w-10 h-10 text-yellow-500" />;
      case 2:
        return <Award className="w-10 h-10 text-purple-500" />;
      case 3:
        return <Star className="w-10 h-10 text-blue-500" />;
      case 4:
        return <Heart className="w-10 h-10 text-red-500" />;
      default:
        return <Gift className="w-10 h-10 text-green-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-b from-primary-50 to-white relative overflow-hidden">
      {/* Position confetti absolutely to cover the entire viewport */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {showConfetti && dimensions.width > 0 && (
          <Confetti
            colors={[
              "#FF6B6B",
              "#FF85A1",
              "#FBB1BD",
              "#4338ca",
              "#7e22ce",
              "#FF9671",
            ]}
            confettiSource={{
              x: 0, // Start from the left edge
              y: 0, // Start from the top edge
              w: dimensions.width, // Span the entire width
              h: 0, // No height (just the top edge)
            }}
            gravity={0.25}
            height={dimensions.height}
            initialVelocityY={0} // No initial upward velocity
            numberOfPieces={300}
            recycle={false}
            width={dimensions.width}
          />
        )}
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full mx-auto text-center mb-8 relative"
        initial={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.6 }}
      >
        {/* Initial success animation */}
        <AnimatePresence>
          {!showBadgeAnimation && (
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
              exit={{ scale: 1.5, opacity: 0 }}
              initial={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                className="bg-primary-100 p-8 rounded-full"
                transition={{ duration: 1, repeat: 1 }}
              >
                <Heart className="w-20 h-20 text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge animation */}
        <AnimatePresence>
          {showBadgeAnimation && !showThankYouMessage && (
            <motion.div
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
              exit={{ scale: 1.5, opacity: 0 }}
              initial={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                className="bg-white p-8 rounded-full shadow-xl border-4 border-primary"
                transition={{ duration: 1 }}
              >
                {getBadgeIcon()}
                <motion.p
                  animate={{ opacity: 1 }}
                  className="mt-2 font-bold text-xl"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {impactBadge}
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content - only show after animations */}
        <AnimatePresence>
          {showThankYouMessage && (
            <motion.div
              animate={{ opacity: 1 }}
              initial={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block bg-primary-100 p-4 rounded-full mb-4">
                <Heart className="w-12 h-12 text-primary" />
              </div>
              <motion.h1
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-bold mb-4 text-primary-800"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Շնորհակալություն Ձեր աջակցության համար!
              </motion.h1>
              <motion.p
                animate={{ y: 0, opacity: 1 }}
                className="text-xl text-default-700 mb-6"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Դուք աջակցել եք{" "}
                <span className="font-bold text-primary">
                  {parseInt(amount).toLocaleString()} ֏
                </span>{" "}
                {projectName}
              </motion.p>

              <motion.div
                animate={{ y: 0, opacity: 1 }}
                initial={{ y: 30, opacity: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Card className="p-6 shadow-lg mb-8 bg-white border-none">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                      {avatarUrl ? (
                        <Avatar
                          className="w-24 h-24 ring-2 ring-primary ring-offset-2 ring-offset-background"
                          color="accent"
                          size="lg"
                        >
                          <Avatar.Image alt="" src={avatarUrl} />
                          <Avatar.Fallback>
                            <UserIcon className="w-12 h-12" />
                          </Avatar.Fallback>
                        </Avatar>
                      ) : (
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                          <Heart className="w-12 h-12 text-primary" />
                        </div>
                      )}
                      <motion.div
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md"
                        initial={{ scale: 0 }}
                        transition={{ delay: 1, type: "spring" }}
                      >
                        {impactBadge}
                      </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold mb-6">
                      Ձեր ազդեցությունը
                    </h2>

                    {funding &&
                      funding.requiredAmount != null &&
                      funding.requiredAmount > 0 && (
                        <>
                          <div className="w-full mb-6">
                            <div className="flex justify-between mb-2 text-sm">
                              <span className="font-semibold">
                                {funding.donationType === "recurring"
                                  ? "Այս ամիս հավաքված՝"
                                  : "Հավաքված՝"}
                              </span>
                              <span className="font-bold text-primary">
                                {Math.round(animatedRaised).toLocaleString()} ֏
                                / {funding.requiredAmount.toLocaleString()} ֏
                              </span>
                            </div>
                            <ProgressBar
                              aria-label="Նախագծի առաջընթաց"
                              className="w-full"
                              color="accent"
                              value={
                                (animatedRaised / funding.requiredAmount) * 100
                              }
                            >
                              <ProgressBar.Track className="h-3 rounded-full">
                                <ProgressBar.Fill className="rounded-full" />
                              </ProgressBar.Track>
                            </ProgressBar>
                            <p className="text-xs text-default-500 mt-2 text-center">
                              {(
                                (animatedRaised / funding.requiredAmount) *
                                100
                              ).toFixed(1)}
                              % նպատակից
                            </p>
                          </div>
                        </>
                      )}
                  </div>
                </Card>
              </motion.div>

              <motion.div
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ y: 20, opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    className={buttonVariants({
                      variant: "secondary",
                      className: "px-6",
                    })}
                    href={projectSlug ? `/project/${projectSlug}` : "/"}
                  >
                    Վերադառնալ նախագիծ
                    <ArrowRight size={18} />
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    className={buttonVariants({
                      variant: "tertiary",
                      className: "px-6",
                    })}
                    href="/"
                  >
                    Գլխավոր էջ
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
