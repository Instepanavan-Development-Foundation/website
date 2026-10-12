"use client";

import Link from "next/link";
import { buttonVariants } from "@heroui/styles";
import { Button, Modal } from "@heroui/react";
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

  if (project.isArchived) return null;

  if (!siteConfig) {
    return null;
  }

  // External fundraiser
  if (project.fundraisingURL) {
    return (
      <Link
        className={buttonVariants({
          variant: "primary",
          size: "lg",
          className: "h-12 rounded-full px-6 shadow-lg shadow-primary/40",
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
        className={buttonVariants({
          variant: "primary",
          size: "lg",
          className: "h-12 rounded-full px-6 shadow-lg shadow-primary/40",
        })}
        href={`/donate/${project.slug}?amount=10000`}
      >
        <span className="text-xl px-8 py-2">Աջակցել հիմա</span>
      </Link>
    );
  }

  // No fundraising setup - show contact modal
  // The Button is the modal's trigger (a direct child of <Modal>).
  return (
    <Modal>
      <Button size="lg" variant="primary">
        Կապնվել աջակցելու համար
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Մանրամասներ</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: siteConfig.defaultContact,
                    }}
                    className="text-container"
                  />
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="primary" onPress={close}>
                    Փակել
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
};
