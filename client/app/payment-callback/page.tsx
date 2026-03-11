"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { parseAmeriabankError } from "@/src/helpers/parseAmeriabankError";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function handlePayment() {
      const paymentID = searchParams.get("paymentID");
      const responseCode = searchParams.get("resposneCode"); // Note: Ameriabank has a typo
      const projectSlug = searchParams.get("project");

      if (!paymentID || !projectSlug) {
        router.replace(
          `/donate/${projectSlug || "unknown"}?error=${encodeURIComponent("Վճարման տվյալները չեն գտնվել")}`,
        );

        return;
      }

      // Check if payment was successful (response code "00" means success)
      if (responseCode !== "00") {
        const errorMessage = parseAmeriabankError(responseCode || "");

        router.replace(
          `/donate/${projectSlug}?error=${encodeURIComponent(errorMessage)}`,
        );

        return;
      }

      // Fetch project to get documentId and name from slug
      const projectResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/projects?filters[slug][$eq]=${projectSlug}&fields[0]=documentId&fields[1]=name`,
      );

      if (!projectResponse.ok) {
        router.replace(
          `/donate/${projectSlug}?error=${encodeURIComponent("Նախագիծը չի գտնվել")}`,
        );

        return;
      }

      const projectData = await projectResponse.json();
      const project = projectData.data?.[0];

      if (!project?.documentId) {
        router.replace(
          `/donate/${projectSlug}?error=${encodeURIComponent("Նախագիծը չի գտնվել")}`,
        );

        return;
      }

      // Call backend to save payment details
      try {
        const jwt =
          typeof window !== "undefined" ? localStorage.getItem("jwt") : null;

        if (!jwt) {
          router.replace(
            `/donate/${projectSlug}?error=${encodeURIComponent("Խնդրում ենք մուտք գործել")}`,
          );

          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/get-payment-details`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${jwt}`,
            },
            body: JSON.stringify({
              paymentId: paymentID,
              projectDocumentId: project.documentId,
            }),
          },
        );

        if (response.ok) {
          const paymentData = await response.json();
          const amount = paymentData?.amount || "";
          const projectName = project?.name || projectSlug;

          // Redirect to success page with payment details
          router.replace(
            `/donate/success?amount=${amount}&project=${encodeURIComponent(projectName)}&slug=${projectSlug}`,
          );
        } else {
          const data = await response.json();

          router.replace(
            `/donate/${projectSlug}?error=${encodeURIComponent(data.errorMessage || "Վճարման տվյալները պահպանելիս սխալ է տեղի ունեցել")}`,
          );
        }
      } catch (error) {
        router.replace(
          `/donate/${projectSlug}?error=${encodeURIComponent("Սերվերի հետ կապի սխալ")}`,
        );
      }
    }

    handlePayment();
  }, [searchParams, router]);

  return (
    <div className="container mx-auto max-w-2xl mt-10 text-center">
      <h2 className="text-2xl font-bold mb-4">Վճարման մշակում...</h2>
      <p>Խնդրում ենք սպասել</p>
    </div>
  );
}
