"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Share2, Check, Link2 } from "lucide-react";

/**
 * View / Edit + primary Share. Uses the native share sheet on mobile (where
 * this is actually used, handing a card to someone in person) and falls back to
 * copying the link on desktop, where navigator.share is usually absent.
 */
export function CardActions({
  publicPath,
  editPath,
  name,
  orgName,
}: {
  publicPath: string;
  editPath: string;
  name: string;
  orgName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = `${window.location.origin}${publicPath}`;
    const shareData = {
      title: `${name} — ${orgName}`,
      text: `${name}'s digital card`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed the sheet, or share was blocked — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your card link:", url);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {/* Same tab, so the browser back button returns to the dashboard. */}
        <Link
          href={publicPath}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--app-border-strong)] text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.06]"
        >
          <Eye size={17} strokeWidth={1.8} aria-hidden />
          View
        </Link>
        <Link
          href={editPath}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--app-border-strong)] text-sm font-medium text-white transition-colors duration-200 hover:bg-white/[0.06]"
        >
          <Pencil size={17} strokeWidth={1.8} aria-hidden />
          Edit
        </Link>
      </div>

      <button type="button" onClick={onShare} className="btn-primary w-full">
        {copied ? (
          <>
            <Check size={18} strokeWidth={2.2} aria-hidden />
            Link copied
          </>
        ) : (
          <>
            <Share2 size={18} strokeWidth={1.9} aria-hidden />
            Share card
          </>
        )}
      </button>
    </div>
  );
}

/** Compact copy-link button for rows that don't warrant the full action set. */
export function CopyLinkButton({ publicPath }: { publicPath: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const url = `${window.location.origin}${publicPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your card link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-white"
    >
      {copied ? (
        <Check size={16} strokeWidth={2.2} aria-hidden />
      ) : (
        <Link2 size={16} strokeWidth={1.8} aria-hidden />
      )}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
