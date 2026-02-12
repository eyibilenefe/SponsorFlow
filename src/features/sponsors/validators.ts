import { z } from "zod";

import { THREAD_STATUSES } from "@/types/domain";

export const createSponsorSchema = z.object({
  companyName: z.string().min(2, "Sirket adi zorunlu"),
  website: z.string().optional(),
  contactName: z.string().min(2, "Iletisim kisi adi zorunlu"),
  contactEmail: z.string().email("Gecerli bir e-posta girin"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  tagIds: z.array(z.string().uuid()).optional().default([])
});

export const createTagSchema = z.object({
  name: z.string().min(2, "Etiket adi en az 2 karakter olmali").max(50)
});

export const updateCompanySchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2, "Sirket adi zorunlu"),
  website: z.string().optional()
});

export const createCompanyContactSchema = z.object({
  companyId: z.string().uuid(),
  fullName: z.string().min(2, "Iletisim kisi adi zorunlu"),
  email: z.string().email("Gecerli bir e-posta girin"),
  phone: z.string().optional(),
  notes: z.string().optional()
});

export const updateCompanyContactSchema = createCompanyContactSchema.extend({
  contactId: z.string().uuid()
});

export const deleteCompanyContactSchema = z.object({
  companyId: z.string().uuid(),
  contactId: z.string().uuid()
});

export const updateThreadStatusSchema = z.object({
  contactId: z.string().uuid(),
  threadId: z.string().uuid().nullable(),
  companyId: z.string().uuid(),
  status: z.enum(THREAD_STATUSES)
});

export const filterSchema = z.object({
  tagId: z.string().uuid().optional(),
  status: z.enum(THREAD_STATUSES).optional(),
  ownerUserId: z.string().uuid().optional(),
  search: z.string().optional()
});
