import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";

/**
 * Returns the current session or redirects to /login.
 * Call from Server Components or Route Handlers.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}

/**
 * Returns the current session only if the user's role is in `allowed`.
 * Redirects to /login if unauthenticated, /dashboard if role is denied.
 *
 * @example
 *   const session = await requireRole(["ADMIN"]);
 *   const session = await requireRole(["ADMIN", "NEGOTIATOR"]);
 */
export async function requireRole(allowed: UserRole[]) {
  const session = await requireAuth();
  const role = (session.user as { role?: UserRole }).role;

  if (!role || !allowed.includes(role)) {
    redirect("/dashboard"); // insufficient permissions → back to home
  }

  return session;
}

/** Convenience guards for each role family. */
export const requireAdmin = () => requireRole(["ADMIN"]);

export const requireNegotiatorOrAbove = () =>
  requireRole(["ADMIN", "NEGOTIATOR"]);

export const requireIntakeOrAbove = () =>
  requireRole(["ADMIN", "NEGOTIATOR", "INTAKE"]);

// READ_ONLY can see everything that's visible to all staff; use requireAuth().
