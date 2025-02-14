"use client";

import { Link } from "@heroui/link";
import { IProject } from "@/src/models/project";
import { button as buttonStyles } from "@nextui-org/theme";
import { Button } from "@nextui-org/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { getSiteConfig } from "@/config/site";
import { useEffect, useState } from "react";
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

  if (!project.fundraisingURL) {
    return (
      <>
        <Button color="success" onPress={onOpen} size="lg">
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
                    className="text-container"
                    dangerouslySetInnerHTML={{
                      __html: siteConfig.defaultContact,
                    }}
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
  }

  return (
    <Link
      target="_blank"
      href={project.fundraisingURL}
      className={buttonStyles({
        color: "success",
        radius: "full",
        variant: "shadow",
        size: "lg",
      })}
    >
      <span className="text-xl px-8 py-2">Աջակցել նախագծին</span>
    </Link>
  );
};
