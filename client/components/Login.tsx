"use client";

import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("jwt")) {
      router.replace("/");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Խնդրում ենք լրացնել բոլոր դաշտերը");

      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/local`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email, password }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message || "Մուտքը ձախողվեց");
      } else {
        // Store JWT and email in localStorage
        if (typeof window !== "undefined" && data?.jwt) {
          localStorage.setItem("jwt", data.jwt);
          localStorage.setItem("email", email);
          // Dispatch custom event to notify navbar of login state change
          window.dispatchEvent(new CustomEvent("loginStateChanged"));
          router.push("/");
        }
        // Optionally redirect or reset form
      }
    } catch (err) {
      setError("Մուտքագրեք վավեր տվյալներ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
        <Input
          required
          autoComplete="current-password"
          label="Գաղտնաբառ"
          placeholder="********"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          Մուտք գործել
        </Button>
      </form>
      <p className="max-w-md mx-auto mt-4 text-center text-sm text-gray-600">
        Դեռ չունեք հաշիվ?{" "}
        <Link
          className="text-rose-500 hover:underline font-medium"
          href="/register"
        >
          Գրանցվել
        </Link>
      </p>
    </>
  );
};

export default Login;
