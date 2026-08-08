import { ok } from '@/server/api-helpers';
import { getSearchSuggestions } from '@/server/repositories/taxonomy';

/** GET /api/search/suggestions?q= — подсказки для строки поиска. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  return ok(getSearchSuggestions(query));
}
