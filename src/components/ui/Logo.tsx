import { cn } from "@/lib/utils";

// Inline SVG variants — assets sourced from /DMS-Brand/

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="shieldGrad-plain"
          x1="42"
          y1="46"
          x2="202"
          y2="222"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path
        d="M46 64c0-6.6 5.4-12 12-12h112c2.7 0 5.3 1.4 6.7 3.7l13.6 22.3c1.1 1.7 1.7 3.8 1.7 5.9v52.8c0 17.9-8.5 34.8-22.9 45.7L128 214l-41.1-31.6C72.5 171.5 64 154.6 64 136.7V64z"
        fill="url(#shieldGrad-plain)"
      />
      <path
        d="M82 38h82c5.5 0 10.5 3 13.1 7.8L190 68"
        stroke="#06B6D4"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M68 52h92c5.5 0 10.5 3 13.1 7.8L181 74"
        stroke="#67E8F9"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M78 144l35 26 67-75"
        stroke="#FFFFFF"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M76 130l37 29 44-49"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <text
        x="77"
        y="111"
        fill="#FFFFFF"
        fontFamily="Inter, Arial, Helvetica, sans-serif"
        fontSize="42"
        fontWeight="800"
        letterSpacing="-1"
      >
        DMS
      </text>
    </svg>
  );
}

function SidebarIconSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bgGrad-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient
          id="shieldGrad-sidebar"
          x1="42"
          y1="46"
          x2="202"
          y2="222"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" rx="28" ry="28" width="240" height="240" fill="url(#bgGrad-sidebar)" />
      <g transform="translate(20 20) scale(0.84)">
        <path
          d="M46 64c0-6.6 5.4-12 12-12h112c2.7 0 5.3 1.4 6.7 3.7l13.6 22.3c1.1 1.7 1.7 3.8 1.7 5.9v52.8c0 17.9-8.5 34.8-22.9 45.7L128 214l-41.1-31.6C72.5 171.5 64 154.6 64 136.7V64z"
          fill="url(#shieldGrad-sidebar)"
        />
        <path
          d="M82 38h82c5.5 0 10.5 3 13.1 7.8L190 68"
          stroke="#06B6D4"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M68 52h92c5.5 0 10.5 3 13.1 7.8L181 74"
          stroke="#67E8F9"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M78 144l35 26 67-75"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M76 130l37 29 44-49"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <text
          x="77"
          y="111"
          fill="#FFFFFF"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="42"
          fontWeight="800"
          letterSpacing="-1"
        >
          DMS
        </text>
      </g>
    </svg>
  );
}

function MainLogoSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 240"
      fill="none"
      className={className}
      aria-label="Debt Management System"
      role="img"
    >
      <defs>
        <linearGradient
          id="shieldGrad-main"
          x1="42"
          y1="46"
          x2="202"
          y2="222"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <g transform="translate(20 10)">
        <path
          d="M46 64c0-6.6 5.4-12 12-12h112c2.7 0 5.3 1.4 6.7 3.7l13.6 22.3c1.1 1.7 1.7 3.8 1.7 5.9v52.8c0 17.9-8.5 34.8-22.9 45.7L128 214l-41.1-31.6C72.5 171.5 64 154.6 64 136.7V64z"
          fill="url(#shieldGrad-main)"
        />
        <path
          d="M82 38h82c5.5 0 10.5 3 13.1 7.8L190 68"
          stroke="#06B6D4"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M68 52h92c5.5 0 10.5 3 13.1 7.8L181 74"
          stroke="#67E8F9"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M78 144l35 26 67-75"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M76 130l37 29 44-49"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <text
          x="77"
          y="111"
          fill="#FFFFFF"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="42"
          fontWeight="800"
          letterSpacing="-1"
        >
          DMS
        </text>
      </g>
      <g transform="translate(250 58)">
        <text
          x="0"
          y="50"
          fill="#1E3A8A"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="62"
          fontWeight="700"
          letterSpacing="-1.2"
        >
          Debt Management
        </text>
        <text
          x="0"
          y="118"
          fill="#1E3A8A"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="62"
          fontWeight="700"
          letterSpacing="-1.2"
        >
          System
        </text>
      </g>
    </svg>
  );
}

function LoginLogoSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 700 360"
      fill="none"
      className={className}
      aria-label="Debt Management System"
      role="img"
    >
      <defs>
        <linearGradient
          id="shieldGrad-login"
          x1="42"
          y1="46"
          x2="202"
          y2="222"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <g transform="translate(236 18)">
        <path
          d="M46 64c0-6.6 5.4-12 12-12h112c2.7 0 5.3 1.4 6.7 3.7l13.6 22.3c1.1 1.7 1.7 3.8 1.7 5.9v52.8c0 17.9-8.5 34.8-22.9 45.7L128 214l-41.1-31.6C72.5 171.5 64 154.6 64 136.7V64z"
          fill="url(#shieldGrad-login)"
        />
        <path
          d="M82 38h82c5.5 0 10.5 3 13.1 7.8L190 68"
          stroke="#06B6D4"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M68 52h92c5.5 0 10.5 3 13.1 7.8L181 74"
          stroke="#67E8F9"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M78 144l35 26 67-75"
          stroke="#FFFFFF"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M76 130l37 29 44-49"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <text
          x="77"
          y="111"
          fill="#FFFFFF"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="42"
          fontWeight="800"
          letterSpacing="-1"
        >
          DMS
        </text>
      </g>
      <g transform="translate(92 262)">
        <text
          x="0"
          y="0"
          fill="#1E3A8A"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="52"
          fontWeight="700"
          letterSpacing="-1"
        >
          Debt Management System
        </text>
        <text
          x="93"
          y="42"
          fill="#475569"
          fontFamily="Inter, Arial, Helvetica, sans-serif"
          fontSize="22"
          fontWeight="500"
        >
          Debt negotiation lifecycle, simplified.
        </text>
      </g>
    </svg>
  );
}

// ──────────────────────────────────────────────
// Public Logo component
// ──────────────────────────────────────────────

type LogoVariant = "full" | "compact" | "icon" | "login";

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
}

/**
 * Reusable logo component backed by inline SVG assets.
 *
 * Variants:
 *   full    — horizontal lockup with "Debt Management System" text (main-logo)
 *   compact — plain shield icon + "Debt Management System" text (sidebar expanded)
 *   icon    — shield on rounded-square background (sidebar collapsed)
 *   login   — vertical lockup with tagline (login screen)
 */
export function Logo({ variant = "full", className }: LogoProps) {
  switch (variant) {
    case "full":
      return <MainLogoSvg className={cn("h-10 w-auto", className)} />;

    case "compact":
      return (
        <div className={cn("flex items-center gap-2.5", className)}>
          <ShieldIcon className="h-8 w-8 shrink-0" />
          <span
            className="text-sm font-semibold leading-tight text-[#1E3A8A] dark:text-blue-300"
            style={{ letterSpacing: "-0.02em" }}
          >
            Debt Management
            <br />
            System
          </span>
        </div>
      );

    case "icon":
      return <SidebarIconSvg className={cn("h-9 w-9", className)} />;

    case "login":
      return <LoginLogoSvg className={cn("w-full max-w-xs", className)} />;
  }
}
