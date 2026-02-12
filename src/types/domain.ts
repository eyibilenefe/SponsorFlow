export const THREAD_STATUSES = [
  "NEW",
  "SENT",
  "WAITING",
  "REPLIED",
  "MEETING",
  "WON",
  "LOST"
] as const;

export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export const MESSAGE_DIRECTIONS = ["OUTBOUND", "INBOUND"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const CAMPAIGN_SEND_STATUSES = ["PENDING", "SENT", "FAILED"] as const;
export type CampaignSendStatus = (typeof CAMPAIGN_SEND_STATUSES)[number];

export const THREAD_STATUS_LABELS: Record<ThreadStatus, string> = {
  NEW: "Yeni",
  SENT: "Gonderildi",
  WAITING: "Yanit Bekleniyor",
  REPLIED: "Yanit Geldi",
  MEETING: "Toplanti",
  WON: "Kazanildi",
  LOST: "Kaybedildi"
};

export function getThreadStatusLabel(status: ThreadStatus): string {
  return THREAD_STATUS_LABELS[status];
}

export const MESSAGE_DIRECTION_LABELS: Record<MessageDirection, string> = {
  OUTBOUND: "Giden",
  INBOUND: "Gelen"
};

export function getMessageDirectionLabel(direction: MessageDirection): string {
  return MESSAGE_DIRECTION_LABELS[direction];
}

export interface SponsorFilters {
  tagId?: string;
  status?: ThreadStatus;
  ownerUserId?: string;
  search?: string;
}

export interface DashboardMetrics {
  totalSponsors: number;
  waitingReplies: number;
  replied: number;
  won: number;
  lost: number;
}

export interface CampaignSendResult {
  sentCount: number;
  failedCount: number;
  failures: Array<{
    contactId: string;
    contactEmail: string;
    error: string;
  }>;
}
