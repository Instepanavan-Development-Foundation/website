"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";

import { isAuthenticated, sendMagicLink, setToken } from "@/src/services/userService";

const Login = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || undefined;

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Խնդրում ենք լրացնել էլ. հասցեն");

      return;
    }
    setLoading(true);
    try {
      await sendMagicLink(email, returnUrl);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Սերվերի սխալ");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 4) {
      setError("Կոդը պետք է լինի 4 թիվ");

      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/magic-link/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Սխալ կոդ");

        return;
      }

      setToken(data.jwt);
      window.dispatchEvent(new CustomEvent("loginStateChanged"));

      // OTP path: add proceed=1 so the donation page auto-submits payment
      if (returnUrl) {
        const separator = returnUrl.includes("?") ? "&" : "?";
        router.replace(`${returnUrl}${separator}proceed=1`);
      } else {
        router.replace("/");
      }
    } catch {
      setError("Սերվերի սխալ");
    } finally {
      setOtpLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ստուգեք ձեր էլ. հասցեն</h2>
          <p className="text-gray-600 text-sm">
            Ուղարկվեց <strong>{email}</strong> հասցեին։ Կոդը գործում է 5 րոպե:
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleOtpSubmit}>
          <Input
            autoFocus
            classNames={{
              input: "text-4xl font-bold tracking-widest text-center",
              inputWrapper: "h-20",
            }}
            inputMode="numeric"
            label="Մուտքի կոդ"
            maxLength={4}
            pattern="[0-9]{4}"
            placeholder="0000"
            type="text"
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);

              setOtp(val);
            }}
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button
            className="text-sm font-normal text-white bg-linear-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
            isDisabled={otp.length !== 4}
            isLoading={otpLoading}
            size="md"
            type="submit"
            variant="flat"
          >
            Հաստատել
          </Button>
        </form>

        <Button
          className="text-sm font-normal text-gray-600"
          variant="light"
          onPress={() => {
            setSent(false);
            setOtp("");
            setError("");
          }}
        >
          Փորձել այլ էլ. հասցե
        </Button>
      </div>
    );
  }

  return (
    <form
      className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold text-center">Մուտք գործել</h2>
      <Input
        required
        autoComplete="email"
        label="Էլ. հասցե"
        placeholder="your@email.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <Button
        className="text-sm font-normal text-white bg-linear-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
        isLoading={loading}
        size="md"
        type="submit"
        variant="flat"
      >
        Ուղարկել մուտքի կոդ
      </Button>
    </form>
  );
};

export default Login;
