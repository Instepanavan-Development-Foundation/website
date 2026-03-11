import crypto from "crypto";

export interface User {
  id: number;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem("jwt");
}

/**
 * Set the JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("jwt", token);
}

/**
 * Remove the JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("jwt");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Fetch current user data
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();

  if (!token) return null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token is invalid, remove it
        removeToken();
      }

      return null;
    }

    const user = await response.json();

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);

    return null;
  }
}

/**
 * Generate Gravatar URL from email
 */
export function getGravatarUrl(email: string, size = 200): string {
  const trimmedEmail = email.trim().toLowerCase();
  const hash = crypto.createHash("sha256").update(trimmedEmail).digest("hex");

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

/**
 * Get user's avatar URL (Gravatar based on email)
 */
export async function getUserAvatarUrl(size = 200): Promise<string | null> {
  const user = await getCurrentUser();

  if (!user?.email) return null;

  return getGravatarUrl(user.email, size);
}

/**
 * Login user
 */
export async function login(
  identifier: string,
  password: string,
): Promise<{ user: User; jwt: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/local`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Մուտքը ձախողվեց");
  }

  // Save token
  setToken(data.jwt);

  return { user: data.user, jwt: data.jwt };
}

/**
 * Register new user
 */
export async function register(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ user: User; jwt: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/local/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, email, password, fullName }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Գրանցումը ձախողվեց");
  }

  // Save token
  setToken(data.jwt);

  return { user: data.user, jwt: data.jwt };
}

/**
 * Logout user
 */
export function logout(): void {
  removeToken();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}
