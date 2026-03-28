import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Sign In — Debt Management System" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo variant="login" className="w-72" />
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
            Internal staff access only
          </p>
        </div>
        <div className="rounded-2xl bg-white shadow-xl shadow-slate-900/8 ring-1 ring-slate-200 overflow-hidden">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://netcoresolutions.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            NetCoreSolutions.com
          </a>
        </p>
      </div>
    </main>
  );
}
