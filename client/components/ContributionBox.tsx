"use client";

import Link from "next/link";
import { button as buttonStyles } from "@heroui/theme";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { useEffect, useState } from "react";

import { getSiteConfig } from "@/config/site";
import { IProject } from "@/src/models/project";
import { ISiteConfig } from "@/src/models/site-config";

export const ContributionBox = ({ project }: { project: IProject }) => {
  const [siteConfig, setSiteConfig] = useState<ISiteConfig | null>(null);

  useEffect(() => {
    const fetchSiteConfig = async () => {
      const config = await getSiteConfig();

      setSiteConfig(config);
    };

    fetchSiteConfig();
  }, []);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  if (project.isArchived) return null;

  if (!siteConfig) {
    return null;
  }

  // External fundraiser
  if (project.fundraisingURL) {
    return (
      <Link
        className={buttonStyles({
          color: "primary",
          radius: "full",
          variant: "shadow",
          size: "lg",
        })}
        href={project.fundraisingURL}
        target="_blank"
      >
        <span className="text-xl px-8 py-2">Աջակցել նախագծին</span>
      </Link>
    );
  }

  // Internal fundraiser (has goal)
  if (project.requiredAmount) {
    return (
      <Link
        className={buttonStyles({
          color: "primary",
          radius: "full",
          variant: "shadow",
          size: "lg",
        })}
        href={`/donate/${project.slug}?amount=10000`}
      >
        <span className="text-xl px-8 py-2">Աջակցել հիմա</span>
      </Link>
    );
  }

  // No fundraising setup - show contact modal
  return (
    <>
      <Button color="primary" size="lg" onPress={onOpen}>
        Կապնվել աջակցելու համար
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Մանրամասներ
              </ModalHeader>
              <ModalBody>
                <div
                  dangerouslySetInnerHTML={{
                    __html: siteConfig.defaultContact,
                  }}
                  className="text-container"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  Փակել
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
