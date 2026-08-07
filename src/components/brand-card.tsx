/* eslint-disable @next/next/no-img-element -- Logos/avatars are user-supplied
   URLs from arbitrary hosts. next/image would require either allowlisting every
   possible host or `hostname: "**"`, which turns the app into an open image
   proxy. These assets are small, so plain <img> is the safer trade. */
import { buildCardTheme } from "@/lib/brand";
import { framingStyle, type ImageFraming } from "@/lib/framing";
import { cn } from "@/lib/utils";

export type BrandCardData = {
  name: string;
  jobTitle?: string | null;
  orgName: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
  /** Framing for the avatar image — photo framing wins when a photo is set. */
  logoFraming?: ImageFraming;
  photoFraming?: ImageFraming;
  primaryColor: string;
  textColor: string;
  secondaryColor: string;
  headingFont: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * The card face — solid brand background, brand text color, accent ring.
 * Shared by the dashboard, the editor preview and the public page so a card
 * looks identical everywhere it appears.
 */
export function BrandCard({
  data,
  qrDataUrl,
  size = "md",
  className,
}: {
  data: BrandCardData;
  qrDataUrl?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const theme = buildCardTheme(
    data.primaryColor,
    data.textColor,
    data.secondaryColor,
    data.headingFont
  );
  const compact = size === "sm";

  const headingStyle =
    data.headingFont === "Poetsen One"
      ? { fontFamily: "var(--font-poetsen)" }
      : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] shadow-[0_18px_50px_-14px_rgba(0,0,0,0.5)]",
        compact ? "p-5" : "p-6",
        className
      )}
      style={{ background: theme.background, color: theme.text }}
    >
      <div className="flex items-start justify-between gap-3">
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
        ) : (
          <span className="h-9 w-9" aria-hidden />
        )}
        <span
          className="pt-1 text-right text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: theme.accent }}
        >
          {data.orgName}
        </span>
      </div>

      <div
        className={cn(
          "flex flex-col items-center text-center",
          compact ? "mt-4" : "mt-6"
        )}
      >
        {/* Accent ring around the logo/photo */}
        <span
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
            compact ? "h-16 w-16" : "h-20 w-20"
          )}
          style={{
            border: `2.5px solid ${theme.accent}`,
            backgroundColor: theme.hairline,
          }}
        >
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt=""
              className="h-full w-full object-cover"
              style={data.photoFraming ? framingStyle(data.photoFraming) : undefined}
            />
          ) : data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt=""
              className="h-full w-full object-contain"
              style={
                data.logoFraming
                  ? framingStyle(data.logoFraming)
                  : { transform: "scale(0.72)" }
              }
            />
          ) : (
            <span
              className={cn("font-semibold", compact ? "text-lg" : "text-xl")}
              style={{ color: theme.text }}
            >
              {initials(data.name)}
            </span>
          )}
        </span>

        <h2
          className={cn(
            "mt-3 font-semibold leading-tight",
            compact ? "text-lg" : "text-2xl"
          )}
          style={{ ...headingStyle, color: theme.text }}
        >
          {data.name}
        </h2>
        {data.jobTitle ? (
          <p
            className={cn("mt-1", compact ? "text-[13px]" : "text-sm")}
            style={{ color: theme.textMuted }}
          >
            {data.jobTitle}
          </p>
        ) : null}
      </div>

      {qrDataUrl ? (
        <div className={cn("flex justify-center", compact ? "mt-5" : "mt-6")}>
          {/* Quiet zone matches the generated code's light color, so the
              padding and the QR read as one block rather than a white sticker. */}
          <span
            className="rounded-2xl p-2.5"
            style={{
              backgroundColor: theme.qrLight,
              border: `2.5px solid ${theme.accent}`,
            }}
          >
            <img
              src={qrDataUrl}
              alt={`QR code linking to ${data.name}'s card`}
              width={compact ? 116 : 148}
              height={compact ? 116 : 148}
              className="block"
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}
