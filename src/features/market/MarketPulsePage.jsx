import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BriefcaseBusiness,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { CountingNumber } from '@/components/animate-ui/primitives/texts/counting-number';
import { Fade, Fades } from '@/components/animate-ui/primitives/effects/fade';
import {
  getKeywordDaily,
  getKeywordTrend,
  getMarketJobs,
  getMarketStats,
  getTrendingKeywords,
} from './marketApi';
import './marketPulse.css';

const ACCENT = '#0066cc';
const ACCENT_SOFT = '#7ab0e8';
const INK = '#1d1d1f';
const MUTED = '#7a7a7a';
const HAIRLINE = '#e0e0e0';

const WINDOW_OPTIONS = [
  { value: 7, label: '7 ngày' },
  { value: 14, label: '14 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
];

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}
function formatFullDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso) {
  if (!iso) return '—';
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return '—';
  const diffMs = Date.now() - target;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return formatFullDate(iso);
}

function formatSalary(item) {
  if (item.salaryMinMillionVnd && item.salaryMaxMillionVnd) {
    return `${item.salaryMinMillionVnd}–${item.salaryMaxMillionVnd} triệu`;
  }
  if (item.salaryMaxMillionVnd) {
    return `≤ ${item.salaryMaxMillionVnd} triệu`;
  }
  return item.salaryText || 'Thoả thuận';
}

export function MarketPulsePage({ embedded = false } = {}) {
  const [windowDays, setWindowDays] = useState(30);
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const [stats, setStats] = useState(null);

  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [keywordTrend, setKeywordTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const [keywordFilter, setKeywordFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [jobs, setJobs] = useState({ items: [], total: 0 });
  const [jobsLoading, setJobsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadTrending() {
    setTrendingLoading(true);
    try {
      const data = await getTrendingKeywords({ days: windowDays, top: 15 });
      const items = data.items || [];
      setTrending(items);
      if (items.length === 0) {
        setSelectedKeyword('');
      } else if (
        !selectedKeyword
        || !items.some((entry) => entry.keyword === selectedKeyword)
      ) {
        setSelectedKeyword(items[0].keyword);
      }
    } catch (error) {
      toast.error(error.message || 'Không tải được trending keywords.');
    } finally {
      setTrendingLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await getMarketStats();
      setStats(data);
    } catch (error) {
      toast.error(error.message || 'Không tải được thống kê thị trường.');
    }
  }

  async function loadKeywordTrend(keyword) {
    if (!keyword) {
      setKeywordTrend([]);
      return;
    }
    setTrendLoading(true);
    try {
      const data = await getKeywordDaily(keyword, { days: windowDays });
      setKeywordTrend(data.points || []);
    } catch (error) {
      toast.error(error.message || 'Không tải được dữ liệu xu hướng.');
      setKeywordTrend([]);
    } finally {
      setTrendLoading(false);
    }
  }

  async function loadJobs() {
    setJobsLoading(true);
    try {
      const data = await getMarketJobs({
        keyword: keywordFilter || undefined,
        page,
        pageSize,
      });
      setJobs({ items: data.items || [], total: data.total || 0 });
    } catch (error) {
      toast.error(error.message || 'Không tải được danh sách job.');
    } finally {
      setJobsLoading(false);
    }
  }

  useEffect(() => {
    loadTrending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowDays]);

  useEffect(() => {
    loadKeywordTrend(selectedKeyword);
  }, [selectedKeyword]);

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordFilter, page]);

  const totalPages = Math.max(1, Math.ceil(jobs.total / pageSize));

  const chartData = useMemo(
    () =>
      trending.map((item) => ({
        keyword: item.keyword,
        jobCount: item.jobCount,
        totalMentions: item.totalMentions,
      })),
    [trending],
  );

  const lineData = useMemo(
    () =>
      keywordTrend.map((point) => ({
        date: formatDate(point.date),
        jobCount: point.jobCount,
        totalMentions: point.totalMentions,
      })),
    [keywordTrend],
  );

  function handleSearchSubmit(event) {
    event.preventDefault();
    setKeywordFilter(searchInput.trim());
    setPage(1);
  }

  function handleClearSearch() {
    setSearchInput('');
    setKeywordFilter('');
    setPage(1);
  }

  const topKeyword = trending[0]?.keyword || '—';
  const topKeywordCount = trending[0]?.jobCount || 0;
  const totalTrackedKeywords = stats?.totalKeywords ?? trending.length;
  const totalJobsInDb = stats?.totalJobs ?? jobs.total;
  const lastScrapedRelative = formatRelative(stats?.lastScrapedAt);
  const lastScrapedTitle = stats?.lastScrapedAt ? formatFullDate(stats.lastScrapedAt) : '';

  return (
    <div className={embedded ? 'market-pulse market-pulse--embedded' : 'market-pulse'}>
      {!embedded && (
        <Fade inView={false}>
          <header className="market-pulse__header">
            <div className="market-pulse__title-row">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              >
                <Activity size={28} color={ACCENT} />
              </motion.div>
              <div>
                <p className="market-pulse__eyebrow">Market Pulse</p>
                <h1>Xu hướng kỹ năng IT theo nhu cầu tuyển dụng thực tế</h1>
                <p className="market-pulse__subtitle">
                  Tổng hợp từ các tin tuyển dụng IT mới nhất trên thị trường Việt Nam.
                </p>
              </div>
            </div>
          </header>
        </Fade>
      )}

      <Fades inView={false} delay={120} holdDelay={80}>
        <div className="market-pulse__kpis">
          <div className="market-pulse__kpi">
            <div className="market-pulse__kpi-icon market-pulse__kpi-icon--primary">
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <span className="market-pulse__kpi-label">Tổng tin tuyển dụng</span>
              <span className="market-pulse__kpi-value">
                <CountingNumber number={totalJobsInDb} />
              </span>
              <span className="market-pulse__kpi-sub" title={lastScrapedTitle}>
                Cập nhật {lastScrapedRelative}
              </span>
            </div>
          </div>
          <div className="market-pulse__kpi">
            <div className="market-pulse__kpi-icon market-pulse__kpi-icon--accent">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="market-pulse__kpi-label">Kỹ năng hot nhất</span>
              <span className="market-pulse__kpi-value market-pulse__kpi-value--small">
                {topKeyword}
                <span className="market-pulse__kpi-sub">
                  <CountingNumber number={topKeywordCount} /> tin
                </span>
              </span>
            </div>
          </div>
          <div className="market-pulse__kpi">
            <div className="market-pulse__kpi-icon market-pulse__kpi-icon--soft">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="market-pulse__kpi-label">Keywords trending</span>
              <span className="market-pulse__kpi-value">
                <CountingNumber number={totalTrackedKeywords} />
              </span>
            </div>
          </div>
        </div>
      </Fades>

      <section className="market-pulse__section">
        <div className="market-pulse__section-head">
          <div>
            <h2>
              <TrendingUp size={18} /> Top kỹ năng được tuyển nhiều nhất
            </h2>
            <p className="market-pulse__hint">
              Số lượng tin tuyển dụng nhắc đến mỗi kỹ năng trong cửa sổ thời gian đã chọn.
            </p>
          </div>
          <div className="market-pulse__window-tabs">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`market-pulse__window-tab ${
                  windowDays === opt.value ? 'is-active' : ''
                }`}
                onClick={() => setWindowDays(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              className="market-pulse__refresh"
              onClick={loadTrending}
              aria-label="Làm mới"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="market-pulse__chart-card">
          {trendingLoading ? (
            <div className="market-pulse__loading">
              <LoaderCircle className="market-pulse__spin" size={24} />
              <span>Đang tải dữ liệu…</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="market-pulse__empty">
              Chưa có dữ liệu trong cửa sổ thời gian này.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <CartesianGrid stroke={HAIRLINE} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke={MUTED} tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="keyword"
                  type="category"
                  stroke={MUTED}
                  tick={{ fontSize: 12 }}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: ACCENT_SOFT, opacity: 0.3 }}
                  contentStyle={{
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="jobCount"
                  radius={[0, 4, 4, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                  onClick={(data) => data?.keyword && setSelectedKeyword(data.keyword)}
                  cursor="pointer"
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.keyword}
                      fill={entry.keyword === selectedKeyword ? ACCENT : ACCENT_SOFT}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="market-pulse__section">
        <div className="market-pulse__section-head">
          <div>
            <h2>
              <TrendingUp size={18} /> Diễn biến 30 ngày của{' '}
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedKeyword || 'none'}
                  className="market-pulse__keyword-chip"
                  initial={{ opacity: 0, y: -6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {selectedKeyword || '—'}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="market-pulse__hint">
              Bấm vào thanh trong biểu đồ ở trên để chọn kỹ năng khác.
            </p>
          </div>
        </div>

        <div className="market-pulse__chart-card">
          {trendLoading ? (
            <div className="market-pulse__loading">
              <LoaderCircle className="market-pulse__spin" size={24} />
              <span>Đang tải xu hướng…</span>
            </div>
          ) : lineData.length === 0 ? (
            <div className="market-pulse__empty">
              Chưa có lịch sử snapshot cho keyword này (cần ít nhất vài lần scrape).
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid stroke={HAIRLINE} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={MUTED} tick={{ fontSize: 12 }} />
                <YAxis stroke={MUTED} tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    border: `1px solid ${HAIRLINE}`,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="jobCount"
                  stroke={ACCENT}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ACCENT }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="market-pulse__section">
        <div className="market-pulse__section-head">
          <div>
            <h2>
              <BriefcaseBusiness size={18} /> Tin tuyển dụng đã thu thập
            </h2>
            <p className="market-pulse__hint">
              {jobs.total} tin trong DB. Lọc theo keyword để xem tin liên quan.
            </p>
          </div>
          <form className="market-pulse__search" onSubmit={handleSearchSubmit}>
            <Search size={14} color={MUTED} />
            <input
              type="text"
              placeholder="vd: react, docker, python…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {keywordFilter && (
              <button
                type="button"
                className="market-pulse__search-clear"
                onClick={handleClearSearch}
              >
                Bỏ lọc
              </button>
            )}
            <button type="submit" className="market-pulse__search-submit">
              Tìm
            </button>
          </form>
        </div>

        <div className="market-pulse__jobs">
          {jobsLoading ? (
            <div className="market-pulse__loading">
              <LoaderCircle className="market-pulse__spin" size={24} />
              <span>Đang tải tin tuyển dụng…</span>
            </div>
          ) : jobs.items.length === 0 ? (
            <div className="market-pulse__empty">Không có tin nào phù hợp.</div>
          ) : (
            <ul className="market-pulse__job-list">
              {jobs.items.map((job, index) => (
                <motion.li
                  key={job.id}
                  className="market-pulse__job"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.32) }}
                >
                  <div className="market-pulse__job-main">
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="market-pulse__job-title"
                    >
                      {job.title}
                      <ExternalLink size={12} />
                    </a>
                    <div className="market-pulse__job-meta">
                      <span>{job.companyName || '—'}</span>
                      <span>•</span>
                      <span>{job.location || '—'}</span>
                      <span>•</span>
                      <span className="market-pulse__job-source">{job.source}</span>
                      <span>•</span>
                      <span title={formatFullDate(job.scrapedAt)}>
                        Đã thu thập {formatRelative(job.scrapedAt)}
                      </span>
                      {job.postedAt && (
                        <>
                          <span>•</span>
                          <span title={formatFullDate(job.postedAt)}>
                            Đăng {formatRelative(job.postedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="market-pulse__job-salary">{formatSalary(job)}</div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>

        {totalPages > 1 && (
          <div className="market-pulse__pagination">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Trước
            </button>
            <span>
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
