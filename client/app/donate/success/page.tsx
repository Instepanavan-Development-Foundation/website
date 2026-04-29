"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";
import {
  Heart,
  Twitter,
  Facebook,
  Copy,
  Check,
  ArrowRight,
  Award,
  Gift,
  Star,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";

import { getUserAvatarUrl } from "@/src/services/userService";
import getData from "@/src/helpers/getData";
import { IProject } from "@/src/models/project";
import getProjectFunding from "@/src/helpers/getProjectFunding";
import { IProjectFunding } from "@/src/models/project-funding";

export default function DonationSuccessPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount") || "5000";
  const projectName = searchParams.get("project") || "նախագծին";
  const projectSlug = searchParams.get("slug") || "";

  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);
  const [impactBadge, setImpactBadge] = useState("");
  const [showBadgeAnimation, setShowBadgeAnimation] = useState(false);
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);
  const [donationRank, setDonationRank] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [project, setProject] = useState<IProject | null>(null);
  const [funding, setFunding] = useState<IProjectFunding | null>(null);
  const [animatedRaised, setAnimatedRaised] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fix for confetti positioning
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Get accurate window dimensions on client side
  useEffect(() => {
    // Set dimensions only after component mounts (client-side)
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Determine impact badge based on donation amount
  useEffect(() => {
    const amountNum = parseInt(amount);

    if (amountNum >= 50000) {
      setImpactBadge("Չեմպիոն");
      setDonationRank(1);
    } else if (amountNum >= 20000) {
      setImpactBadge("Հերոս");
      setDonationRank(2);
    } else if (amountNum >= 10000) {
      setImpactBadge("Փոփոխության կրող");
      setDonationRank(3);
    } else if (amountNum >= 5000) {
      setImpactBadge("Աջակից");
      setDonationRank(4);
    } else {
      setImpactBadge("Ընկեր");
      setDonationRank(5);
    }
  }, [amount]);

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
      const gatheredAmount =
        funding.donationType === "recurring"
          ? funding.currentMonth.recurring.amount
          : funding.allTime.oneTime.amount;

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

  const handleCopyLink = () => {
    const url = window.location.href;

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `Ես աջակցեցի ${amount} ֏ ${projectName}! Միացեք ինձ և աջակցեք այս կարևոր նախաձեռնությանը:`;

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
                          isBordered
                          className="w-24 h-24"
                          color="primary"
                          size="lg"
                          src={avatarUrl}
                        />
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

                    {funding && funding.requiredAmount != null && funding.requiredAmount > 0 && (
                      <>
                        <div className="w-full mb-6">
                          <div className="flex justify-between mb-2 text-sm">
                            <span className="font-semibold">
                              {funding.donationType === "recurring"
                                ? "Այս ամիս հավաքված՝"
                                : "Հավաքված՝"}
                            </span>
                            <span className="font-bold text-primary">
                              {Math.round(animatedRaised).toLocaleString()} ֏ /{" "}
                              {funding.requiredAmount.toLocaleString()} ֏
                            </span>
                          </div>
                          <Progress
                            aria-label="Նախագծի առաջընթաց"
                            className="w-full"
                            color="primary"
                            size="md"
                            value={
                              (animatedRaised / funding.requiredAmount) * 100
                            }
                          />
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

                    <Divider className="my-4 w-full" />

                    <div className="w-full">
                      <h3 className="text-lg font-semibold mb-4 text-center">
                        Կիսվեք Ձեր ազդեցությամբ
                      </h3>

                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        <motion.div
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            as="a"
                            className="bg-[#1DA1F2] text-white"
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                            rel="noopener noreferrer"
                            startContent={<Twitter size={18} />}
                            target="_blank"
                          >
                            Twitter
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            as="a"
                            className="bg-[#4267B2] text-white"
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
                            rel="noopener noreferrer"
                            startContent={<Facebook size={18} />}
                            target="_blank"
                          >
                            Facebook
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05, y: -3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            className="bg-default-100"
                            startContent={
                              copied ? <Check size={18} /> : <Copy size={18} />
                            }
                            onClick={handleCopyLink}
                          >
                            {copied ? "Պատճենված է" : "Պատճենել հղումը"}
                          </Button>
                        </motion.div>
                      </div>
                    </div>
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
                  <Button
                    as={Link}
                    className="px-6"
                    color="primary"
                    endContent={<ArrowRight size={18} />}
                    href={projectSlug ? `/project/${projectSlug}` : "/"}
                    variant="flat"
                  >
                    Վերադառնալ նախագիծ
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    as={Link}
                    className="px-6"
                    color="default"
                    href="/"
                    variant="flat"
                  >
                    Գլխավոր էջ
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
