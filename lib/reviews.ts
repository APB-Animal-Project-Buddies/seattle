export const LIKED_OPTIONS = ["taste", "texture", "seasoning"] as const;
export type LikedOption = (typeof LIKED_OPTIONS)[number];

const MAX_COMMENT = 2000, MAX_NAME = 120, MAX_EMAIL = 254;
const RATING_MIN = 1, RATING_MAX = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReviewInput = {
  rating: number; expectations: number;
  liked?: unknown; comments?: unknown;
  reviewer?: { name?: unknown; email?: unknown } | null;
};
export type ReviewData = {
  rating: number; expectations: number; liked: LikedOption[];
  comments?: string; reviewer?: { name?: string; email?: string };
};

export function isCommentRequired(rating: number): boolean {
  return rating <= 2 || rating === 10;
}

function int1to10(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < RATING_MIN || v > RATING_MAX)
    throw new Error(`${field} must be an integer in ${RATING_MIN}-${RATING_MAX}`);
  return v;
}
function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t.slice(0, max);
}

export function buildReviewData(input: ReviewInput): ReviewData {
  const rating = int1to10(input.rating, "rating");
  const expectations = int1to10(input.expectations, "expectations");
  const likedRaw = Array.isArray(input.liked) ? input.liked : [];
  const liked = LIKED_OPTIONS.filter((o) => (likedRaw as unknown[]).includes(o));
  const comments = str(input.comments, MAX_COMMENT);
  if (isCommentRequired(rating) && !comments) throw new Error("A comment is required for this rating");
  const name = str(input.reviewer?.name, MAX_NAME);
  const email = str(input.reviewer?.email, MAX_EMAIL);
  if (email && !EMAIL_RE.test(email)) throw new Error("Invalid email");
  const data: ReviewData = { rating, expectations, liked };
  if (comments) data.comments = comments;
  if (name || email) {
    data.reviewer = {};
    if (name) data.reviewer.name = name;
    if (email) data.reviewer.email = email;
  }
  return data;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LEN = 5;

export function randomShortCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}
export function generateUniqueShortCode(exists: (c: string) => boolean, maxAttempts = 10): string {
  for (let i = 0; i < maxAttempts; i++) {
    const c = randomShortCode();
    if (!exists(c)) return c;
  }
  throw new Error("Could not generate a unique short code");
}

export function isValidShortCode(code: unknown): code is string {
  return typeof code === "string" && /^[a-z0-9]{1,16}$/.test(code);
}
export function parseDishTarget(link: { target_type: string; target_id: string } | null | undefined): number | null {
  if (!link || link.target_type !== "dish_review") return null;
  const id = Number.parseInt(link.target_id, 10);
  return Number.isInteger(id) && String(id) === link.target_id.trim() ? id : null;
}
