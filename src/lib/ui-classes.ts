/** Shared Tailwind class strings for consistent UI across the app. */

// ─── Form inputs ──────────────────────────────────────────────────────────────

export const FIELD_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Use for filter <select> elements (no full-width by default). */
export const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const TEXTAREA_CLASS =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-y";

// ─── Page structure ───────────────────────────────────────────────────────────

/** Page-level <h1>. Pair with PAGE_SUBTITLE below. */
export const PAGE_TITLE = "text-2xl font-semibold tracking-tight";
export const PAGE_SUBTITLE = "text-sm text-muted-foreground mt-0.5";

/** Flex row containing a title block on the left and a primary action on the right. */
export const PAGE_HEADER = "flex items-center justify-between";

/** Filter/search toolbar row. */
export const FILTER_BAR = "flex flex-wrap gap-3";

/** Uppercase section label (e.g. "Program Overview"). */
export const SECTION_LABEL =
  "text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3";

// ─── Cards ────────────────────────────────────────────────────────────────────

export const CARD = "rounded-xl border bg-card shadow-sm";
export const CARD_HEADER = "px-5 py-4 border-b flex items-center justify-between gap-4";
export const CARD_TITLE = "text-sm font-semibold";
export const CARD_BODY = "px-5 py-4";

// ─── Tables ───────────────────────────────────────────────────────────────────

export const TABLE_WRAPPER = "rounded-xl border overflow-hidden";
export const TABLE_HEAD_ROW = "bg-muted/50 text-left";
export const TABLE_TH = "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide";
export const TABLE_TR = "hover:bg-muted/30 transition-colors";
export const TABLE_TD = "px-4 py-3 text-sm";
/** For colspan empty-state rows inside a table body. */
export const TABLE_EMPTY_TD = "px-4 py-10 text-center text-sm text-muted-foreground";

// ─── Links ────────────────────────────────────────────────────────────────────

/** Inline link in table rows or detail views. */
export const LINK_SUBTLE = "font-medium hover:underline underline-offset-2";

// ─── Status pills ─────────────────────────────────────────────────────────────

/**
 * Base class for all status/priority pills.
 * Combine with a color variant: `${PILL} ${PILL_GREEN}`
 */
export const PILL = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

// Semantic color variants — combine with PILL
export const PILL_GREEN  = "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20";
export const PILL_BLUE   = "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20";
export const PILL_YELLOW = "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20";
export const PILL_ORANGE = "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20";
export const PILL_RED    = "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20";
export const PILL_GRAY   = "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20";
export const PILL_PURPLE = "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20";

// ─── Domain badge maps ────────────────────────────────────────────────────────
// Usage: <span className={`${PILL} ${CLIENT_STATUS_BADGE[status]}`}>{label}</span>

export const CLIENT_STATUS_BADGE: Record<string, string> = {
  ONBOARDING: PILL_BLUE,
  ACTIVE:     PILL_GREEN,
  GRADUATED:  PILL_PURPLE,
  WITHDRAWN:  PILL_GRAY,
  DEFAULTED:  PILL_RED,
};

export const TASK_STATUS_BADGE: Record<string, string> = {
  TODO:        PILL_GRAY,
  IN_PROGRESS: PILL_BLUE,
  DONE:        PILL_GREEN,
  CANCELLED:   PILL_RED,
};

export const TASK_PRIORITY_BADGE: Record<string, string> = {
  LOW:    PILL_GRAY,
  MEDIUM: PILL_YELLOW,
  HIGH:   PILL_ORANGE,
  URGENT: PILL_RED,
};

export const ACCOUNT_STATUS_BADGE: Record<string, string> = {
  ACTIVE:         PILL_BLUE,
  IN_NEGOTIATION: PILL_YELLOW,
  SETTLED:        PILL_GREEN,
  CHARGED_OFF:    PILL_GRAY,
  DISPUTED:       PILL_ORANGE,
  WITHDRAWN:      PILL_RED,
};

export const CREDITOR_TYPE_BADGE: Record<string, string> = {
  ORIGINAL_CREDITOR: PILL_BLUE,
  COLLECTION_AGENCY: PILL_ORANGE,
  LAW_FIRM:          PILL_PURPLE,
  DEBT_BUYER:        PILL_YELLOW,
  OTHER:             PILL_GRAY,
};

export const ACTIVITY_TYPE_BADGE: Record<string, string> = {
  CALL:            PILL_BLUE,
  EMAIL:           PILL_PURPLE,
  LETTER:          PILL_GRAY,
  INTERNAL_NOTE:   PILL_YELLOW,
  STATUS_CHANGE:   PILL_ORANGE,
  OFFER_SENT:      PILL_GREEN,
  OFFER_RECEIVED:  PILL_GREEN,
};
