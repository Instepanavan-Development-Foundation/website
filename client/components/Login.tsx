"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";

import { isAuthenticated, sendMagicLink } from "@/src/services/userService";

const Login = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const returnUrl = searchParams.get("returnUrl") || undefined;
      await sendMagicLink(email, returnUrl);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-4 text-center">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-gray-600">
          We sent a login link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-400">
          The link expires in 15 minutes.
        </p>
        <Button
          className="text-sm font-normal text-gray-600"
          variant="light"
          onPress={() => setSent(false)}
        >
          Try a different email
        </Button>
      </div>
    );
  }

  return (
    <form
      className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold text-center">Log in or sign up</h2>
      <Input
        required
        autoComplete="email"
        label="Email"
        placeholder="your@email.com"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}
      <Button
        className="text-sm font-normal text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
        isLoading={loading}
        size="md"
        type="submit"
        variant="flat"
      >
        Send login link
      </Button>
    </form>
  );
};

export default Login;
