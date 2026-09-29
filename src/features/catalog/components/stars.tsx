import { Star } from "lucide-react";

export function Stars({ rating, count, size = 14 }: { rating: number; count: number; size?: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      <div className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-line"} />
        ))}
      </div>
      <span>{count > 0 ? `${rating.toFixed(1)} (${count})` : "No reviews yet"}</span>
    </div>
  );
}
