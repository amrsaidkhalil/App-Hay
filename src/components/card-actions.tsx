"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Share2, Check, Link2 } from "lucide-react";
import { ShareSheet } from "./share-sheet";

/** View / Edit + a Share button that opens the custom share sheet. */
export function CardActions({
  publicPath,
  editPath,
  name,
  orgName,
  qrDataUrl,
}: {
  publicPath: string;
  editPath: string;
  name: string;
  orgName: string;
  qrDataUrl?: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {/* Same tab, so the browser back button returns to the dashboard. */}
        <Link
          href={publicPath}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--app-border-strong)] text-sm font-medium text-[var(--app-fg)] transition-colors duration-200 hover:bg-[var(--app-overlay)]"
        >
          <Eye size={17} strokeWidth={1.8} aria-hidden />
          View
        </Link>
        <Link
          href={editPath}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--app-border-strong)] text-sm font-medium text-[var(--app-fg)] transition-colors duration-200 hover:bg-[var(--app-overlay)]"
        >
          <Pencil size={17} strokeWidth={1.8} aria-hidden />
          Edit
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setShareOpen(true)}
        className="btn-primary w-full"
      >
        <Share2 size={18} strokeWidth={1.9} aria-hidden />
        Share card
      </button>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        publicPath={publicPath}
        name={name}
        orgName={orgName}
        qrDataUrl={qrDataUrl}
      />
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
      className="inline-flex min-h-[44px] items-center gap-2 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-[var(--app-fg)]"
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
