import { Badge } from "@/components/ui/Badge";
import { getThreadStatusLabel, type ThreadStatus } from "@/types/domain";

interface StatusBadgeProps {
  status: ThreadStatus;
}

const toneByStatus: Record<ThreadStatus, "neutral" | "blue" | "green" | "orange" | "red"> = {
  NEW: "neutral",
  SENT: "blue",
  WAITING: "orange",
  REPLIED: "blue",
  MEETING: "green",
  WON: "green",
  LOST: "red"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge tone={toneByStatus[status]}>{getThreadStatusLabel(status)}</Badge>;
}
