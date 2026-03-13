"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";

import { getToken, setToken } from "@/src/services/userService";

export default function MagicLinkVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    async function verifyToken() {
      const token = searchParams.get("token");
      const retUrl = searchParams.get("returnUrl");
      setReturnUrl(retUrl);

      if (!token) {
        setError("Invalid link");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/magic-link/verify?token=${encodeURIComponent(token)}`,
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Verification failed");
          return;
        }

        // Store JWT
        setToken(data.jwt);

        // Notify navbar
        window.dispatchEvent(new CustomEvent("loginStateChanged"));

        if (data.isNewUser) {
          // Show name input for new users
          setIsNewUser(true);
        } else {
          // Existing user — redirect immediately
          redirectToDestination(retUrl);
        }
      } catch {
        setError("Something went wrong");
      }
    }

    verifyToken();
  }, [searchParams, router]);

  function redirectToDestination(retUrl?: string | null) {
    if (retUrl) {
      router.replace(decodeURIComponent(retUrl));
    } else {
      router.replace("/");
    }
  }

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);

    try {
      const token = getToken();
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fullName: fullName.trim() }),
        },
      );
    } catch {
      // Non-critical — continue even if name save fails
    }

    redirectToDestination(returnUrl);
  }

  function handleSkip() {
    redirectToDestination(returnUrl);
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-4 text-center">
        <h2 className="text-2xl font-bold text-red-500">Error</h2>
        <p className="text-gray-600">{error}</p>
        <Link
          className="text-rose-500 hover:underline font-medium mt-2"
          href="/login"
        >
          Try again
        </Link>
      </div>
    );
  }

  if (isNewUser) {
    return (
      <form
        className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-6"
        onSubmit={handleNameSubmit}
      >
        <h2 className="text-2xl font-bold text-center">Welcome!</h2>
        <p className="text-gray-600 text-center text-sm">
          What&apos;s your name?
        </p>
        <Input
          autoComplete="name"
          autoFocus
          label="Full name"
          placeholder="John Doe"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Button
          className="text-sm font-normal text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
          isLoading={savingName}
          size="md"
          type="submit"
          variant="flat"
        >
          Continue
        </Button>
        <Button
          className="text-sm font-normal text-gray-600"
          variant="light"
          onPress={handleSkip}
        >
          Skip
        </Button>
      </form>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-4 items-center text-center">
      <Spinner size="lg" />
      <p className="text-gray-600">Verifying...</p>
    </div>
  );
}
