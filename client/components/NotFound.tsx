"use client";

import { Button } from "@heroui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IProject } from "@/src/models/project";
import { ProjectCard } from "@/components/home/ProjectCard";
import getData from "@/src/helpers/getData";

export default function NotFound() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);

  useEffect(() => {
    // Fetch projects (any active projects)
    const fetchProjects = async () => {
      try {
        const result = await getData({
          type: "projects",
          filters: {
            isArchived: false,
          },
          populate: {
            image: { fields: ["url"] },
            blogs: {
              sort: ["isFeatured:desc", "createdAt:desc"],
              populate: ["contribution.contributor.avatar"],
              filters: {
                contribution: {
                  $null: false,
                },
              },
            },
          },
          sort: "isFeatured:desc,createdAt:desc",
          limit: 3,
        });
        console.log("Projects response:", result);
        setProjects(result.data || []);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleShake = () => {
    if (isShaking) return; // Prevent multiple shakes at once

    setIsShaking(true);
    setShakeCount((prev) => prev + 1);

    // After shake animation, show projects with falling animation
    setTimeout(() => {
      setIsShaking(false);
      setShowProjects(true);
    }, 800);
  };

  return (
    <div
      className={`flex flex-col items-center justify-center mt-10 gap-8 px-4 ${
        isShaking ? "shake-page" : ""
      }`}
    >
      {/* 404 Message */}
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          404: Էջը չի գտնվել
        </h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {!showProjects && !loading && projects.length > 0 && (
          <Button
            size="lg"
            color="secondary"
            variant="flat"
            onClick={handleShake}
            disabled={isShaking}
            className="relative"
          >
            {isShaking ? "Թափահարում է... 🌪️" : "Թափահարեք էջը՝ գտնելու համար! 🔍"}
          </Button>
        )}
      </div>

      {/* Featured Projects */}
      {!loading && projects.length > 0 && showProjects && (
        <div className="w-full max-w-6xl mt-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 shake-reveal">
              {shakeCount === 1
                ? "Օ՜ֆ! Էջը չգտանք, բայց ահա մի քանի ծրագիր, որոնք կարող եք աջակցել! 🎉"
                : "Ահա մի քանի ծրագիր, որոնք կարող եք աջակցել!"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 shake-reveal">
              {shakeCount === 1
                ? "Սարսելու մեջ չենք գտել էջը, բայց գտանք ավելի լավ բան!"
                : "Ընտրեք ծրագիր և օգնեք փոփոխություն ստեղծել"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <Link key={project.documentId} href={`/project/${project.slug}`}>
                <div
                  className="fall-from-top"
                  style={{
                    animationDelay: `${index * 200}ms`,
                  }}
                >
                  <ProjectCard {...project} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-10px) rotate(-2deg);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(10px) rotate(2deg);
          }
        }

        @keyframes fallFromTop {
          0% {
            opacity: 0;
            transform: translateY(-100px) rotate(-5deg);
          }
          60% {
            transform: translateY(10px) rotate(2deg);
          }
          80% {
            transform: translateY(-5px) rotate(-1deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0);
          }
        }

        @keyframes shakeReveal {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        :global(.shake-page) {
          animation: shake 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }

        :global(.fall-from-top) {
          animation: fallFromTop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        :global(.shake-reveal) {
          animation: shakeReveal 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
