import { parseVenueQuery } from '@/lib/query-params';
import { searchVenues } from '@/server/repositories/venues';
import { ok } from '@/server/api-helpers';

/** GET /api/venues?q=&category=&sort=… — поиск по каталогу. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseVenueQuery(url.searchParams);
  const result = searchVenues(query);

  return ok({
    items: result.items,
    total: result.total,
    page: result.page,
    perPage: result.perPage,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
  });
}
