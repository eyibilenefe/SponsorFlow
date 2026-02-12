import { z } from "zod";

import { THREAD_STATUSES } from "@/types/domain";

export const createCampaignSchema = z.object({
  name: z.string().min(2, "Kampanya adi en az 2 karakter olmali"),
  subjectTemplate: z.string().min(1, "Konu sablonu bos olamaz"),
  bodyTemplate: z.string().min(1, "Icerik sablonu bos olamaz"),
  tagId: z.string().uuid().optional(),
  status: z.enum(THREAD_STATUSES).optional(),
  ownerUserId: z.string().uuid().optional(),
  search: z.string().optional()
});
