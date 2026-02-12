"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import { isAuthenticated, register } from "@/src/services/userService";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
    setSuccess(false);
    if (!email || !password) {
      setError("Խնդրում ենք լրացնել էլ. հասցեն և գաղտնաբառը");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
      setSuccess(true);

      // Redirect to saved URL from query parameter or home
      const returnUrl = searchParams.get("returnUrl");
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl));
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Սերվերի սխալ");
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
        <h2 className="text-2xl font-bold text-center">Գրանցվել</h2>
        <Input
          autoComplete="name"
          label="Ամբողջ անուն"
          placeholder="Ջոն Դո"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
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
          autoComplete="new-password"
          label="Գաղտնաբառ"
          placeholder="********"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-sm text-center">
            Գրանցումը հաջողվեց
          </div>
        )}
        <Button
          className="text-sm font-normal text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-rose-500 hover:to-pink-500 transition-all duration-300 shadow-md hover:shadow-lg"
          isLoading={loading}
          size="md"
          type="submit"
          variant="flat"
        >
          Գրանցվել
        </Button>
      </form>
      <p className="max-w-md mx-auto mt-4 text-center text-sm text-gray-600">
        Արդեն ունեք հաշիվ?{" "}
        <Link
          className="text-rose-500 hover:underline font-medium"
          href="/login"
        >
          Մուտք գործել
        </Link>
      </p>
    </>
  );
};

export default Register;
