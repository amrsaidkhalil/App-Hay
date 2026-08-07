"use client";

import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { deleteContactAction } from "@/app/dashboard/leads/[id]/actions";

/** Overflow menu with the one destructive action a contact has: delete it. */
export function ContactMenu({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="More options"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--app-fg-muted)] transition-colors duration-200 hover:bg-[var(--app-overlay)]"
      >
        <MoreVertical size={20} strokeWidth={1.9} aria-hidden />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-11 z-50 min-w-[10rem] overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] py-1 shadow-lg">
            <form action={deleteContactAction}>
              <input type="hidden" name="id" value={contactId} />
              <button
                type="submit"
                className="flex min-h-[44px] w-full items-center gap-2.5 px-4 text-[15px] text-[var(--danger)] transition-colors duration-200 hover:bg-[var(--app-overlay)]"
              >
                <Trash2 size={16} strokeWidth={1.9} aria-hidden />
                Delete
              </button>
            </form>
          </div>
        </>
      ) : null}
    </div>
  );
}
