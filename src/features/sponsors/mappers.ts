import type { SponsorFilters } from "@/types/domain";
import { filterSchema } from "@/features/sponsors/validators";

export function mapSearchParamsToSponsorFilters(
  searchParams: Record<string, string | string[] | undefined>
): SponsorFilters {
  const parsed = filterSchema.safeParse({
    tagId: typeof searchParams.tagId === "string" ? searchParams.tagId : undefined,
    status: typeof searchParams.status === "string" ? searchParams.status : undefined,
    ownerUserId:
      typeof searchParams.ownerUserId === "string" ? searchParams.ownerUserId : undefined,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined
  });

  if (!parsed.success) {
    return {};
  }

  return parsed.data;
}
