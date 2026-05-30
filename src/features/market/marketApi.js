import { apiRequest } from '../../api/http';

export function getTrendingKeywords({ days = 30, top = 20 } = {}) {
  const params = new URLSearchParams({ days: String(days), top: String(top) });
  return apiRequest(`/api/market/keywords/trending?${params}`);
}

export function getKeywordTrend(keyword, { days = 30 } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  return apiRequest(
    `/api/market/keywords/${encodeURIComponent(keyword)}/trend?${params}`,
  );
}

export function getKeywordDaily(keyword, { days = 30 } = {}) {
  const params = new URLSearchParams({ days: String(days) });
  return apiRequest(
    `/api/market/keywords/${encodeURIComponent(keyword)}/daily?${params}`,
  );
}

export function getMarketJobs({ keyword, source, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (keyword) params.set('keyword', keyword);
  if (source) params.set('source', source);
  return apiRequest(`/api/market/jobs?${params}`);
}

export function getMarketJobDetail(id) {
  return apiRequest(`/api/market/jobs/${encodeURIComponent(id)}`);
}

export function getMarketStats() {
  return apiRequest('/api/market/stats');
}
