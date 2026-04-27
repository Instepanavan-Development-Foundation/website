"use client";

import { Spinner } from "@heroui/spinner";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { setToken } from "@/src/services/userService";

export default function MagicLinkVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function verifyToken() {
      const token = searchParams.get("token");
      const retUrl = searchParams.get("returnUrl");

      if (!token) {
        setError("Անվավեր հղում");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/magic-link/verify?token=${encodeURIComponent(token)}`,
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Ստուգումը ձախողվեց");
          return;
        }

        setToken(data.jwt);
        window.dispatchEvent(new CustomEvent("loginStateChanged"));

        if (retUrl) {
          router.replace(decodeURIComponent(retUrl));
        } else {
          router.replace("/");
        }
      } catch {
        setError("Սերվերի սխալ");
      }
    }

    verifyToken();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-4 text-center">
        <h2 className="text-2xl font-bold text-red-500">Սխալ</h2>
        <p className="text-gray-600">{error}</p>
        <Link
          className="text-rose-500 hover:underline font-medium mt-2"
          href="/login"
        >
          Փորձել կրկին
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-4 items-center text-center">
      <Spinner size="lg" />
      <p className="text-gray-600">Ստուգում...</p>
    </div>
  );
}
