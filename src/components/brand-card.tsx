/* eslint-disable @next/next/no-img-element -- Logos/avatars are user-supplied
   URLs from arbitrary hosts. next/image would require either allowlisting every
   possible host or `hostname: "**"`, which turns the app into an open image
   proxy. These assets are small, so plain <img> is the safer trade. */
import { buildCardTheme } from "@/lib/brand";
import { cn } from "@/lib/utils";

export type BrandCardData = {
  name: string;
  jobTitle?: string | null;
  orgName: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  headingFont: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * The card face. Shared by the dashboard, the editor preview and the public
 * page so a card looks identical everywhere it appears.
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
        "relative isolate overflow-hidden rounded-[1.75rem] text-white shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)]",
        compact ? "p-5" : "p-6",
        className
      )}
      style={{ background: theme.background }}
    >
      {/* Hairline highlight — gives the face a lit top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[1.75rem]"
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)" }}
      />

      <div className="flex items-start justify-between gap-3">
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg bg-white/10 object-contain p-1"
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
        <span
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.12] ring-2",
            compact ? "h-16 w-16" : "h-20 w-20"
          )}
          style={{ ["--tw-ring-color" as string]: theme.hairline }}
        >
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : data.logoUrl ? (
            <img
              src={data.logoUrl}
              alt=""
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <span
              className={cn(
                "font-semibold text-white/90",
                compact ? "text-lg" : "text-xl"
              )}
            >
              {initials(data.name)}
            </span>
          )}
        </span>

        <h2
          className={cn(
            "mt-3 font-semibold leading-tight text-white",
            compact ? "text-lg" : "text-2xl"
          )}
          style={headingStyle}
        >
          {data.name}
        </h2>
        {data.jobTitle ? (
          <p
            className={cn(
              "mt-1 text-white/70",
              compact ? "text-[13px]" : "text-sm"
            )}
          >
            {data.jobTitle}
          </p>
        ) : null}
      </div>

      {qrDataUrl ? (
        <div className={cn("flex justify-center", compact ? "mt-5" : "mt-6")}>
          <span className="rounded-2xl bg-white p-2.5 shadow-lg">
            <img
              src={qrDataUrl}
              alt={`QR code linking to ${data.name}'s card`}
              width={compact ? 116 : 148}
              height={compact ? 116 : 148}
              className="block rounded-lg"
            />
          </span>
        </div>
      ) : null}
    </div>
  );
}
