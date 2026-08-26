import { formatLastLiftShort, type LastLift } from "@/lib/progression";

export function LastLiftHint({ last }: { last: LastLift | null | undefined }) {
  if (!last) return null;
  return (
    <p className="mt-1 text-xs font-bold text-muted">
      Last: {formatLastLiftShort(last)}
    </p>
  );
}
