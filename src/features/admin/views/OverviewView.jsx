import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchDailyStats } from '../adminApi';
import { formatMoney } from '../../../shared/format';
import {
  KpiRow,
  KpiTile,
  SectionTitle,
} from '../components/DashboardPrimitives';

const ACTION_BLUE      = '#0066cc';
const ACTION_BLUE_SOFT = '#cfe3fb';
const SERIES_INK       = '#1d1d1f';
const SERIES_MUTED     = '#7a7a7a';
const SERIES_ACCENT    = '#a18cff';
const HAIRLINE         = '#e0e0e0';
const SOFT             = '#f0f0f0';

/* ────────────────────────────────────────────────────────────
   Date helpers — UTC throughout to match server-side dates.
   ──────────────────────────────────────────────────────────── */
function pad2(n) { return String(n).padStart(2, '0'); }
function toIsoDate(date) { return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`; }
function parseIsoDate(value) {
  const [y, m, d] = (value || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}
function startOfMonthUtc(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)); }
function endOfMonthUtc(date)   { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)); }
function addDaysUtc(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function addMonthsUtc(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}
function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function clampToToday(date) {
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return date.getTime() > todayUtc.getTime() ? todayUtc : date;
}

/* ────────────────────────────────────────────────────────────
   Range presets.
   ──────────────────────────────────────────────────────────── */
function presetRange(preset) {
  const today  = new Date();
  const utcNow = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  switch (preset) {
    case '7d':       return { start: addDaysUtc(utcNow, -6),  end: utcNow };
    case '30d':      return { start: addDaysUtc(utcNow, -29), end: utcNow };
    case '90d':      return { start: addDaysUtc(utcNow, -89), end: utcNow };
    case 'thisMonth': {
      const start = startOfMonthUtc(utcNow);
      return { start, end: utcNow };
    }
    case 'lastMonth': {
      const lastEnd   = new Date(Date.UTC(utcNow.getUTCFullYear(), utcNow.getUTCMonth(), 0));
      const lastStart = startOfMonthUtc(lastEnd);
      return { start: lastStart, end: lastEnd };
    }
    case 'thisYear': {
      const start = new Date(Date.UTC(utcNow.getUTCFullYear(), 0, 1));
      return { start, end: utcNow };
    }
    default:
      return { start: addDaysUtc(utcNow, -29), end: utcNow };
  }
}

const PRESETS = [
  { id: '7d',        label: '7 ngày'  },
  { id: '30d',       label: '30 ngày' },
  { id: '90d',       label: '90 ngày' },
  { id: 'thisMonth', label: 'Tháng này' },
  { id: 'lastMonth', label: 'Tháng trước' },
  { id: 'thisYear',  label: 'Năm nay' },
  { id: 'custom',    label: 'Tuỳ chỉnh' },
];

/* ────────────────────────────────────────────────────────────
   Tooltip & utilities.
   ──────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <strong>{label}</strong>}
      {payload.map((entry) => (
        <p key={entry.dataKey || entry.name}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

function totalOf(series, key) {
  return series.reduce((sum, point) => sum + (Number(point?.[key]) || 0), 0);
}

/* ────────────────────────────────────────────────────────────
   Build a list of (year, month) tuples covering [start, end].
   ──────────────────────────────────────────────────────────── */
function listMonthsInRange(start, end) {
  const months = [];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const tail = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor.getTime() <= tail.getTime()) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor = addMonthsUtc(cursor, 1);
  }
  return months;
}

function formatRangeLabel(start, end) {
  const sameYear  = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const fmt = (d, opts) => d.toLocaleDateString('vi-VN', { ...opts, timeZone: 'UTC' });
  if (sameMonth) {
    return `${fmt(start, { day: '2-digit' })}–${fmt(end, { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
  if (sameYear) {
    return `${fmt(start, { day: '2-digit', month: 'short' })} – ${fmt(end, { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }
  return `${fmt(start, { day: '2-digit', month: 'short', year: 'numeric' })} – ${fmt(end, { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

/* ────────────────────────────────────────────────────────────
   Main view.
   ──────────────────────────────────────────────────────────── */
export function OverviewView({ stats, session }) {
  const [presetId, setPresetId] = useState('30d');
  const [range, setRange]       = useState(() => presetRange('30d'));
  const [draftStart, setDraftStart] = useState(() => toIsoDate(presetRange('30d').start));
  const [draftEnd,   setDraftEnd]   = useState(() => toIsoDate(presetRange('30d').end));

  const [seriesByMonth, setSeriesByMonth] = useState({}); // key: 'YYYY-MM' -> Series[]
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  /* When preset changes (and not custom), recompute range. */
  useEffect(() => {
    if (presetId === 'custom') return;
    const next = presetRange(presetId);
    setRange(next);
    setDraftStart(toIsoDate(next.start));
    setDraftEnd(toIsoDate(next.end));
  }, [presetId]);

  /* Fetch all months covered by the range. Cache by 'YYYY-MM' key. */
  useEffect(() => {
    if (!range.start || !range.end) return;
    const months = listMonthsInRange(range.start, range.end);
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const missing = months.filter(({ year, month }) => !seriesByMonth[`${year}-${pad2(month)}`]);
        if (missing.length === 0) { setLoading(false); return; }

        const fetched = await Promise.all(
          missing.map(({ year, month }) => fetchDailyStats(session, year, month).then((data) => ({
            key: `${year}-${pad2(month)}`,
            series: data?.series || [],
          }))),
        );
        if (cancelled) return;
        setSeriesByMonth((prev) => {
          const next = { ...prev };
          fetched.forEach(({ key, series }) => { next[key] = series; });
          return next;
        });
      } catch (requestError) {
        if (!cancelled) setError(requestError?.message || 'Could not load daily stats.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, session]);

  /* Merge & filter series for the active range. */
  const dailySeries = useMemo(() => {
    if (!range.start || !range.end) return [];
    const months = listMonthsInRange(range.start, range.end);
    const startMs = range.start.getTime();
    const endMs   = range.end.getTime();
    const out     = [];
    months.forEach(({ year, month }) => {
      const key  = `${year}-${pad2(month)}`;
      const list = seriesByMonth[key] || [];
      list.forEach((point) => {
        const date = new Date(point.date);
        if (Number.isNaN(date.getTime())) return;
        const utcDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).getTime();
        if (utcDay < startMs || utcDay > endMs) return;
        out.push({
          ...point,
          dayMs: utcDay,
          label: formatTickLabel(new Date(utcDay), range),
          tooltipLabel: new Date(utcDay).toLocaleDateString('vi-VN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          }),
        });
      });
    });
    out.sort((a, b) => a.dayMs - b.dayMs);
    return out;
  }, [range, seriesByMonth]);

  function applyCustomRange() {
    const start = parseIsoDate(draftStart);
    const end   = parseIsoDate(draftEnd);
    if (!start || !end) {
      setError('Vui lòng chọn ngày bắt đầu và ngày kết thúc.');
      return;
    }
    if (start.getTime() > end.getTime()) {
      setError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    setError('');
    setRange({ start: clampToToday(start), end: clampToToday(end) });
  }

  if (!stats) {
    return <p className="empty-state">No stats available yet.</p>;
  }

  const users         = stats.users         || {};
  const subscriptions = stats.subscriptions || {};
  const payments      = stats.payments      || {};
  const content       = stats.content       || {};

  const rangeLabel    = formatRangeLabel(range.start, range.end);
  const rangeDays     = diffDays(range.start, range.end) + 1;
  const rangeNewUsers     = totalOf(dailySeries, 'newUsers');
  const rangeNewSubs      = totalOf(dailySeries, 'newSubscriptions');
  const rangeRevenue      = totalOf(dailySeries, 'paidRevenue');
  const rangeNewResources = totalOf(dailySeries, 'newResources');
  const todayIso          = toIsoDate(new Date());

  return (
    <section className="admin-section">
      <SectionTitle
        eyebrow="Overview"
        title={`Daily activity — ${rangeLabel}`}
        subtitle={
          loading
            ? 'Đang tải dữ liệu…'
            : `${dailySeries.length}/${rangeDays} ngày có dữ liệu`
        }
      />

      {/* Range picker */}
      <article className="surface-card range-picker">
        <div className="range-presets" role="tablist" aria-label="Khoảng thời gian">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={presetId === p.id}
              className={presetId === p.id ? 'active' : ''}
              onClick={() => setPresetId(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {presetId === 'custom' && (
          <form
            className="range-custom"
            onSubmit={(e) => { e.preventDefault(); applyCustomRange(); }}
          >
            <label>
              <span>Từ ngày</span>
              <input
                type="date"
                value={draftStart}
                max={draftEnd || todayIso}
                onChange={(e) => setDraftStart(e.target.value)}
              />
            </label>
            <label>
              <span>Đến ngày</span>
              <input
                type="date"
                value={draftEnd}
                min={draftStart || undefined}
                max={todayIso}
                onChange={(e) => setDraftEnd(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary">Áp dụng</button>
          </form>
        )}
      </article>

      {error && <div className="notice error">{error}</div>}

      <KpiRow>
        <KpiTile
          label="Người dùng mới"
          value={rangeNewUsers}
          sub={`${users.total ?? 0} tổng`}
        />
        <KpiTile
          label="Lượt đăng ký gói"
          value={rangeNewSubs}
          sub={`${subscriptions.active ?? 0} đang hoạt động`}
          tone="active"
        />
        <KpiTile
          label="Doanh thu"
          value={formatMoney(rangeRevenue)}
          sub={`${formatMoney(payments.totalRevenue || 0)} tổng cộng`}
        />
        <KpiTile
          label="Tài nguyên thêm"
          value={rangeNewResources}
          sub={`${content.totalLearningResources ?? 0} tổng`}
        />
      </KpiRow>

      <div className="chart-grid">
        <DailyAreaCard
          title={`New users — ${rangeLabel}`}
          series={dailySeries}
          dataKey="newUsers"
          legend="New users"
          color={ACTION_BLUE}
          fill={ACTION_BLUE_SOFT}
          wide
        />

        <DailyLineCard
          title={`New subscriptions — ${rangeLabel}`}
          series={dailySeries}
          dataKey="newSubscriptions"
          legend="New subscriptions"
          color={SERIES_INK}
        />

        <DailyAreaCard
          title={`Paid revenue — ${rangeLabel}`}
          series={dailySeries}
          dataKey="paidRevenue"
          legend="Revenue"
          color={ACTION_BLUE}
          fill={ACTION_BLUE_SOFT}
          formatter={(value) => formatMoney(value)}
          wide
        />

        <DailyLineCard
          title={`Learning resources — ${rangeLabel}`}
          series={dailySeries}
          dataKey="newResources"
          legend="New resources"
          color={SERIES_ACCENT}
        />
      </div>
    </section>
  );
}


/* ────────────────────────────────────────────────────────────
   Tick label — switches density based on range size.
   ──────────────────────────────────────────────────────────── */
function formatTickLabel(date, range) {
  const span = diffDays(range.start, range.end);
  if (span <= 31) return pad2(date.getUTCDate());
  if (span <= 120) return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  return date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

/* ────────────────────────────────────────────────────────────
   Chart cards — area + line.
   ──────────────────────────────────────────────────────────── */
function DailyAreaCard({ title, series, dataKey, legend, color, fill, formatter, wide }) {
  if (!series.length) {
    return (
      <article className={`chart-card${wide ? ' wide' : ''}`}>
        <h3 className="chart-title">{title}</h3>
        <p className="empty-state">Không có dữ liệu trong khoảng đã chọn.</p>
      </article>
    );
  }

  const gradientId = `area-${dataKey}`;
  return (
    <article className={`chart-card${wide ? ' wide' : ''}`}>
      <h3 className="chart-title">{title}</h3>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fill} stopOpacity={0.65} />
                <stop offset="100%" stopColor={fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={SOFT} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label"
              stroke={SERIES_MUTED}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: HAIRLINE }}
              minTickGap={16}
            />
            <YAxis
              stroke={SERIES_MUTED}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: HAIRLINE }}
              tickFormatter={formatter}
              width={formatter ? 80 : 36}
            />
            <Tooltip
              content={<ChartTooltip formatter={formatter} />}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel || ''}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              name={legend}
              stroke={color}
              strokeWidth={2.4}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}

function DailyLineCard({ title, series, dataKey, legend, color }) {
  if (!series.length) {
    return (
      <article className="chart-card">
        <h3 className="chart-title">{title}</h3>
        <p className="empty-state">Không có dữ liệu trong khoảng đã chọn.</p>
      </article>
    );
  }

  return (
    <article className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={SOFT} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label"
              stroke={SERIES_MUTED}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: HAIRLINE }}
              minTickGap={16}
            />
            <YAxis
              stroke={SERIES_MUTED}
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: HAIRLINE }}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.tooltipLabel || ''}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              name={legend}
              stroke={color}
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
