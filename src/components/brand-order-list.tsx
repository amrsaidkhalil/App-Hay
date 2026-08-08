"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";
import { reorderBrandsAction, deleteBrandAction } from "@/app/dashboard/actions";

type Brand = {
  orgId: string;
  orgSlug: string;
  name: string;
  role: string;
  primaryColor: string;
  secondaryColor: string;
  canDelete: boolean;
};

const LONG_PRESS_MS = 380;
const DRAG_ARM_THRESHOLD = 8; // px of movement before a long-press is cancelled
const SWIPE_OPEN_PX = 76; // how far a row slides to reveal Delete
const SWIPE_COMMIT_RATIO = 0.4; // fraction of SWIPE_OPEN_PX to snap open on release

/**
 * Long-press a row to drag-reorder it (rank becomes the card list order);
 * swipe it left to reveal Delete. Both start from the same pointerdown, so
 * the first ~8px of movement decides which gesture wins — vertical/none
 * arms the long-press timer, early horizontal movement means swipe.
 */
export function BrandOrderList({ brands: initialBrands }: { brands: Brand[] }) {
  const router = useRouter();
  const [brands, setBrands] = useState(initialBrands);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const gesture = useRef<{
    orgId: string;
    orgSlug: string;
    startX: number;
    startY: number;
    mode: "pending" | "swipe" | "drag" | "cancelled";
    longPressTimer: ReturnType<typeof setTimeout> | null;
    swipeOffset: number;
    dragOrder: string[];
  } | null>(null);

  const setRowRef = useCallback((orgId: string, el: HTMLLIElement | null) => {
    if (el) rowRefs.current.set(orgId, el);
    else rowRefs.current.delete(orgId);
  }, []);

  const persistOrder = useCallback((orgIds: string[]) => {
    reorderBrandsAction(orgIds).catch(() => {
      /* best-effort — a failed reorder just leaves the previous order in the DB */
    });
  }, []);

  const onPointerDown = useCallback(
    (orgId: string, orgSlug: string, e: React.PointerEvent<HTMLLIElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      setOpenRowId((cur) => (cur && cur !== orgId ? null : cur));

      const timer = setTimeout(() => {
        const g = gesture.current;
        if (!g || g.mode !== "pending") return;
        g.mode = "drag";
        // Clear any transform left over from a prior swipe on this row —
        // inline style would otherwise fight the lift class below.
        const row = rowRefs.current.get(orgId);
        const content = row?.querySelector<HTMLElement>("[data-swipe-content]");
        if (content) content.style.transform = "";
        setDraggingId(orgId);
      }, LONG_PRESS_MS);

      gesture.current = {
        orgId,
        orgSlug,
        startX: e.clientX,
        startY: e.clientY,
        mode: "pending",
        longPressTimer: timer,
        swipeOffset: 0,
        dragOrder: brands.map((b) => b.orgId),
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* no capture — gesture still tracks while the pointer stays down */
      }
    },
    [brands]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLLIElement>) => {
      const g = gesture.current;
      if (!g) return;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;

      if (g.mode === "pending") {
        if (Math.abs(dx) > DRAG_ARM_THRESHOLD || Math.abs(dy) > DRAG_ARM_THRESHOLD) {
          if (g.longPressTimer) clearTimeout(g.longPressTimer);
          if (Math.abs(dx) > Math.abs(dy)) {
            g.mode = "swipe";
          } else {
            g.mode = "cancelled";
          }
        }
        return;
      }

      if (g.mode === "swipe") {
        // Stop iOS from treating this as a scroll now that we've claimed it —
        // without this the row can visually stick while the page scrolls
        // underneath it.
        e.preventDefault();
        g.swipeOffset = Math.min(0, Math.max(-SWIPE_OPEN_PX * 1.3, dx));
        const row = rowRefs.current.get(g.orgId);
        if (row) {
          const content = row.querySelector<HTMLElement>("[data-swipe-content]");
          if (content) content.style.transform = `translateX(${g.swipeOffset}px)`;
        }
        return;
      }

      if (g.mode === "drag") {
        // Same reasoning — once the long-press has armed a drag, further
        // vertical movement must move the row, not scroll the page.
        e.preventDefault();
        // Find which sibling row the pointer is currently over and swap ranks.
        const overEl = document
          .elementsFromPoint(e.clientX, e.clientY)
          .find((el) => el instanceof HTMLElement && el.dataset.brandRow) as
          | HTMLElement
          | undefined;
        const overId = overEl?.dataset.brandRow;
        if (overId && overId !== g.orgId) {
          const from = g.dragOrder.indexOf(g.orgId);
          const to = g.dragOrder.indexOf(overId);
          if (from !== -1 && to !== -1) {
            g.dragOrder.splice(from, 1);
            g.dragOrder.splice(to, 0, g.orgId);
            const map = new Map(brands.map((b) => [b.orgId, b]));
            setBrands(g.dragOrder.map((id) => map.get(id)!).filter(Boolean));
          }
        }
      }
    },
    [brands]
  );

  const endGesture = useCallback(() => {
    const g = gesture.current;
    if (!g) return;
    if (g.longPressTimer) clearTimeout(g.longPressTimer);

    if (g.mode === "swipe") {
      const row = rowRefs.current.get(g.orgId);
      const content = row?.querySelector<HTMLElement>("[data-swipe-content]");
      const shouldOpen = g.swipeOffset < -SWIPE_OPEN_PX * SWIPE_COMMIT_RATIO;
      if (content) {
        content.style.transform = shouldOpen ? `translateX(-${SWIPE_OPEN_PX}px)` : "";
      }
      setOpenRowId(shouldOpen ? g.orgId : null);
    }

    if (g.mode === "drag") {
      persistOrder(g.dragOrder);
    }

    // Never armed into a swipe or a drag — a plain tap. A row with its
    // delete button already revealed just closes instead of navigating,
    // same as tapping anywhere else to dismiss it.
    if (g.mode === "pending") {
      if (openRowId === g.orgId) {
        setOpenRowId(null);
      } else {
        router.push(`/dashboard/org/${g.orgSlug}/settings`);
      }
    }

    setDraggingId(null);
    gesture.current = null;
  }, [persistOrder, openRowId, router]);

  return (
    <ul
      ref={listRef}
      className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]"
    >
      {brands.map((brand) => (
        <li
          key={brand.orgId}
          ref={(el) => setRowRef(brand.orgId, el)}
          data-brand-row={brand.orgId}
          onPointerDown={(e) => onPointerDown(brand.orgId, brand.orgSlug, e)}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          className="relative touch-pan-y select-none overflow-hidden"
          style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
        >
          {/* Delete sits underneath, revealed as the row slides left. */}
          <div className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-[var(--danger)]">
            {brand.canDelete ? (
              <button
                type="button"
                onClick={() => setPendingDeleteId(brand.orgId)}
                aria-label={`Delete ${brand.name}`}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-white"
              >
                <Trash2 size={18} strokeWidth={1.9} aria-hidden />
                <span className="text-[11px] font-medium">Delete</span>
              </button>
            ) : (
              <span className="px-2 text-center text-[10px] leading-tight text-white/80">
                Owner only
              </span>
            )}
          </div>

          <div
            data-swipe-content
            className={`relative z-10 flex min-h-[56px] items-center gap-3 bg-[var(--app-surface)] px-4 py-3 transition-[transform,box-shadow] duration-150 ${
              draggingId === brand.orgId
                ? "scale-[1.02] shadow-lg"
                : openRowId === brand.orgId
                  ? ""
                  : "duration-200"
            }`}
          >
            <span
              className="block h-5 w-5 shrink-0 rounded-md ring-1 ring-white/15"
              style={{
                background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`,
              }}
              aria-hidden
            />
            <div
              role="link"
              tabIndex={0}
              aria-label={`${brand.name} branding settings`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/dashboard/org/${brand.orgSlug}/settings`);
                }
              }}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span className="min-w-0 flex-1 truncate text-[15px] text-[var(--app-fg)]">
                {brand.name}
              </span>
              <span className="text-xs text-[var(--app-fg-subtle)]">{brand.role}</span>
              <ChevronRight
                size={18}
                strokeWidth={1.8}
                className="shrink-0 text-[var(--app-fg-subtle)]"
                aria-hidden
              />
            </div>
          </div>
        </li>
      ))}

      {pendingDeleteId ? (
        <ConfirmDeleteDialog
          brand={brands.find((b) => b.orgId === pendingDeleteId)!}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </ul>
  );
}

function ConfirmDeleteDialog({
  brand,
  onCancel,
}: {
  brand: Brand;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--app-surface)] p-5">
        <h2 className="text-[17px] font-semibold text-[var(--app-fg)]">
          Delete {brand.name}?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--app-fg-muted)]">
          This permanently deletes {brand.name}&apos;s card, branding, and
          every contact captured under it. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-[var(--app-border-strong)] text-[15px] font-medium text-[var(--app-fg)]"
          >
            Cancel
          </button>
          <form action={deleteBrandAction} className="flex-1">
            <input type="hidden" name="orgId" value={brand.orgId} />
            <button
              type="submit"
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[var(--danger)] text-[15px] font-semibold text-white"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
