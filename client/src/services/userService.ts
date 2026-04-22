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
 * Generate Gravatar URL from email (browser-compatible using Web Crypto API)
 */
export async function getGravatarUrl(
  email: string,
  size = 200,
): Promise<string> {
  const trimmedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmedEmail);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

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
 * Send magic link to email for passwordless login/registration
 */
export async function sendMagicLink(
  email: string,
  returnUrl?: string,
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/magic-link/send`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, returnUrl }),
    },
  );

  if (!response.ok) {
    const data = await response.json();

    throw new Error(data.error?.message || data.error || "Sending failed");
  }
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
