"use client";

import { useCallback, useRef, useState } from "react";
import { BrandCard, type BrandCardData } from "./brand-card";
import { CardActions } from "./card-actions";
import { cn } from "@/lib/utils";

type CarouselCard = {
  orgId: string;
  data: BrandCardData;
  qrDataUrl?: string;
  publicPath: string;
  editPath: string;
  name: string;
  orgName: string;
};

/**
 * One brand per swipe. The action row lives inside each slide (not hoisted
 * below the scroller) so View/Edit/Share always act on the card they're
 * physically attached to — no separate "which card am I sharing" state to
 * get out of sync while swiping.
 */
export function CardCarousel({ cards }: { cards: CarouselCard[] }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const onScroll = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollerRef.current;
      const first = el?.children[0] as HTMLElement | undefined;
      const second = el?.children[1] as HTMLElement | undefined;
      if (!el || !first || !second) return;
      const step = second.offsetLeft - first.offsetLeft;
      if (step <= 0) return;
      const idx = Math.round(el.scrollLeft / step);
      setActive(Math.min(cards.length - 1, Math.max(0, idx)));
    });
  }, [cards.length]);

  return (
    <div className="space-y-3">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c) => (
          <div
            key={c.orgId}
            className="w-[86%] shrink-0 snap-center space-y-4 sm:w-[380px]"
          >
            <BrandCard data={c.data} qrDataUrl={c.qrDataUrl} size="sm" />
            <CardActions
              publicPath={c.publicPath}
              editPath={c.editPath}
              name={c.name}
              orgName={c.orgName}
              qrDataUrl={c.qrDataUrl}
            />
          </div>
        ))}
      </div>

      {cards.length > 1 ? (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {cards.map((c, i) => (
            <span
              key={c.orgId}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                i === active ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-[var(--app-border-strong)]"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
