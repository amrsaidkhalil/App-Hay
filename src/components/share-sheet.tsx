"use client";

import { useEffect, useRef, useState } from "react";
import {
  X,
  Send,
  Link2,
  MessageCircle,
  Mail,
  MoreHorizontal,
  Wallet,
  Pin,
  Download,
  ExternalLink,
  Check,
} from "lucide-react";
import QRCode from "qrcode";
import { LinkedinGlyph, WhatsappGlyph } from "./social-icons";
import { cn } from "@/lib/utils";

type Row = {
  key: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactElement;
  onClick: () => void;
};

/**
 * Custom share sheet — the OS's own share sheet (navigator.share) can't be
 * laid out or labeled by us, so this reimplements the parts that matter:
 * quick channels as rows, plus a QR the recipient can scan directly. The
 * offline toggle swaps what the QR encodes (a link vs. the vCard itself) so
 * scanning it can work with zero connectivity.
 */
export function ShareSheet({
  open,
  onClose,
  publicPath,
  name,
  orgName,
  qrDataUrl,
  appleWalletAvailable,
}: {
  open: boolean;
  onClose: () => void;
  publicPath: string;
  name: string;
  orgName: string;
  qrDataUrl?: string;
  appleWalletAvailable?: boolean;
}) {
  const [offline, setOffline] = useState(false);
  const [offlineQr, setOfflineQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const vcardTextRef = useRef<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${publicPath}`;
  const text = `${name}'s digital card — ${orgName}`;
  const activeQr = offline ? offlineQr ?? qrDataUrl : qrDataUrl;

  useEffect(() => {
    if (!offline || offlineQr || !open) return;
    let cancelled = false;
    (async () => {
      try {
        if (!vcardTextRef.current) {
          const fetched: string = await fetch(`${publicPath}/vcard`).then((r) => r.text());
          vcardTextRef.current = fetched;
        }
        const dataUrl = await QRCode.toDataURL(vcardTextRef.current as string, {
          margin: 1,
          width: 380,
        });
        if (!cancelled) setOfflineQr(dataUrl);
      } catch {
        if (!cancelled) setOffline(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offline, offlineQr, open, publicPath]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your card link:", url);
    }
  }

  async function shareDirect() {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyLink();
      return;
    }
    try {
      if (activeQr && navigator.canShare) {
        const blob = await fetch(activeQr).then((r) => r.blob());
        const file = new File([blob], `${orgName}-qr.png`, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: text, text, url, files: [file] });
          return;
        }
      }
      await navigator.share({ title: text, text, url });
    } catch {
      /* dismissed — no fallback needed, the sheet is still open */
    }
  }

  const rows: Row[] = [
    {
      key: "copy",
      label: copied ? "Link copied" : "Copy link",
      Icon: (p) => (copied ? <Check {...p} /> : <Link2 {...p} />),
      onClick: copyLink,
    },
    {
      key: "sms",
      label: "Text your card",
      Icon: (p) => <MessageCircle {...p} />,
      onClick: () => {
        window.location.href = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;
      },
    },
    {
      key: "email",
      label: "Email your card",
      Icon: (p) => <Mail {...p} />,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
      },
    },
    {
      key: "whatsapp",
      label: "Send via WhatsApp",
      Icon: (p) => <WhatsappGlyph {...p} />,
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      key: "linkedin",
      label: "Send via LinkedIn",
      Icon: (p) => <LinkedinGlyph {...p} />,
      onClick: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          "_blank",
          "noopener,noreferrer"
        );
      },
    },
    {
      key: "more",
      label: "Send another way",
      Icon: (p) => <MoreHorizontal {...p} />,
      onClick: shareDirect,
    },
    ...(appleWalletAvailable
      ? [
          {
            key: "wallet",
            label: "Add to Apple Wallet",
            Icon: (p: { size?: number }) => <Wallet {...p} />,
            onClick: () => window.open(`${publicPath}#wallet`, "_self"),
          },
        ]
      : []),
    {
      key: "pin",
      label: "Pin QR to Lock Screen",
      Icon: (p) => <Pin {...p} />,
      onClick: shareDirect,
    },
    {
      key: "save",
      label: "Save QR to photos",
      Icon: (p) => <Download {...p} />,
      onClick: () => {
        if (!activeQr) return;
        const a = document.createElement("a");
        a.href = activeQr;
        a.download = `${orgName}-card-qr.png`;
        a.click();
      },
    },
    {
      key: "browser",
      label: "Open in browser",
      Icon: (p) => <ExternalLink {...p} />,
      onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Share card"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-t-3xl bg-[var(--app-surface)] transition-transform duration-200",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "calc(var(--safe-bottom) + 1rem)" }}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-[15px] font-semibold text-[var(--app-fg)]">
            Share card
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-fg-muted)] hover:bg-[var(--app-overlay)]"
          >
            <X size={18} strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 pb-2">
          {activeQr ? (
            <div className="flex flex-col items-center pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeQr}
                alt="QR code for this card"
                className="h-44 w-44 rounded-2xl border border-[var(--app-border)]"
              />
              <p className="mt-3 max-w-[26rem] text-center text-sm text-[var(--app-fg-muted)]">
                Have someone point their camera at this QR code to receive
                your card
              </p>
            </div>
          ) : null}

          <label className="mt-4 flex min-h-[52px] items-center justify-between gap-3 rounded-2xl bg-[var(--app-surface-2)] px-4">
            <span>
              <span className="block text-sm font-medium text-[var(--app-fg)]">
                No internet? Share card offline
              </span>
              <span className="block text-xs text-[var(--app-fg-subtle)]">
                Encodes contact details directly in the QR
              </span>
            </span>
            <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
              <input
                type="checkbox"
                checked={offline}
                onChange={(e) => setOffline(e.target.checked)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "h-7 w-12 rounded-full transition-colors duration-200",
                  offline ? "bg-[var(--accent)]" : "bg-[var(--app-border-strong)]"
                )}
              />
              <span
                className={cn(
                  "absolute left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
                  offline && "translate-x-5"
                )}
              />
            </span>
          </label>

          <button
            type="button"
            onClick={shareDirect}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--app-fg)] text-[15px] font-semibold text-[var(--app-surface)] transition active:scale-[0.98]"
          >
            <Send size={17} strokeWidth={2} aria-hidden />
            Share direct contact
          </button>

          <div className="mt-3 divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)]">
            {rows.map(({ key, label, Icon, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left transition-colors duration-200 hover:bg-[var(--app-overlay)]"
              >
                <Icon size={18} />
                <span className="text-[15px] text-[var(--app-fg)]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
