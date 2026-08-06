import { cn } from "@/lib/utils";

export type CardPreviewData = {
  name: string;
  jobTitle: string;
  orgName: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  facebook: string;
};

export type OrgTheme = {
  primaryColor: string;
  secondaryColor: string;
  headingFont: string;
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  facebook: "Facebook",
};

export function CardPreview({
  data,
  theme,
  className,
}: {
  data: CardPreviewData;
  theme: OrgTheme;
  className?: string;
}) {
  const socials = (
    ["instagram", "linkedin", "twitter", "facebook"] as const
  ).filter((key) => data[key]);

  const headingStyle =
    theme.headingFont === "Poetsen One"
      ? { fontFamily: "var(--font-poetsen)" }
      : undefined;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div
        className="flex h-28 items-end p-5"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
        }}
      >
        <div className="h-16 w-16 rounded-full border-4 border-white bg-slate-200" />
      </div>
      <div className="space-y-3 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900" style={headingStyle}>
            {data.name || "Your name"}
          </h2>
          <p className="text-sm text-slate-500">
            {data.jobTitle || "Job title"} · {data.orgName}
          </p>
        </div>

        <dl className="space-y-1 text-sm text-slate-700">
          {data.phone && <div>📞 {data.phone}</div>}
          {data.whatsapp && <div>💬 {data.whatsapp} (WhatsApp)</div>}
          {data.email && <div>✉️ {data.email}</div>}
          {data.website && <div>🌐 {data.website}</div>}
        </dl>

        {socials.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {socials.map((key) => (
              <span
                key={key}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
              >
                {SOCIAL_LABELS[key]}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-white"
          style={{ backgroundColor: theme.primaryColor }}
        >
          Save contact
        </button>
      </div>
    </div>
  );
}
