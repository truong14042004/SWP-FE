import { useState } from 'react';
import { toast } from 'react-toastify';
import { LoaderCircle, PlayCircle, RefreshCw } from 'lucide-react';
import { authorizedRequest } from '../../../api/http';
import { MarketPulsePage } from '../../market/MarketPulsePage';
import './marketPulseAdmin.css';

function triggerScrape(session) {
  return authorizedRequest('/api/market/scrape-now', session, { method: 'POST' });
}

function triggerReExtract(session) {
  return authorizedRequest('/api/market/re-extract', session, { method: 'POST' });
}

function StatTile({ label, value }) {
  return (
    <div className="mp-admin__stat">
      <span className="mp-admin__stat-label">{label}</span>
      <span className="mp-admin__stat-value">{value}</span>
    </div>
  );
}

export function MarketPulseAdminView({ session }) {
  const [scraping, setScraping] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  async function handleScrape() {
    if (scraping || reExtracting) return;
    if (!window.confirm('Cào TopDev ngay? Có thể mất vài phút.')) return;
    setScraping(true);
    try {
      const result = await triggerScrape(session);
      setLastResult({ kind: 'scrape', ...result });
      toast.success(
        `Scrape xong: ${result.jobsFetched} fetched, ${result.jobsInserted} mới, ${result.mentionsCreated} mentions.`,
      );
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error(error.message || 'Scrape thất bại.');
    } finally {
      setScraping(false);
    }
  }

  async function handleReExtract() {
    if (scraping || reExtracting) return;
    if (!window.confirm('Chạy lại keyword extractor trên toàn bộ job có sẵn?')) return;
    setReExtracting(true);
    try {
      const result = await triggerReExtract(session);
      setLastResult({ kind: 'reExtract', ...result });
      toast.success(
        `Re-extract xong: ${result.jobsFetched} jobs, ${result.mentionsCreated} mentions, ${result.snapshotsCreated} snapshots.`,
      );
      setReloadKey((value) => value + 1);
    } catch (error) {
      toast.error(error.message || 'Re-extract thất bại.');
    } finally {
      setReExtracting(false);
    }
  }

  return (
    <div className="mp-admin">
      <div className="mp-admin__toolbar">
        <div>
          <h2 className="mp-admin__title">Market Pulse — Vận hành</h2>
          <p className="mp-admin__subtitle">
            Trigger scrape thủ công hoặc chạy lại extractor trên data sẵn có.
          </p>
        </div>
        <div className="mp-admin__actions">
          <button
            type="button"
            className="mp-admin__btn mp-admin__btn--primary"
            disabled={scraping || reExtracting}
            onClick={handleScrape}
          >
            {scraping ? (
              <>
                <LoaderCircle className="mp-admin__spin" size={14} />
                Đang scrape…
              </>
            ) : (
              <>
                <PlayCircle size={14} /> Scrape TopDev ngay
              </>
            )}
          </button>
          <button
            type="button"
            className="mp-admin__btn"
            disabled={scraping || reExtracting}
            onClick={handleReExtract}
          >
            {reExtracting ? (
              <>
                <LoaderCircle className="mp-admin__spin" size={14} />
                Đang re-extract…
              </>
            ) : (
              <>
                <RefreshCw size={14} /> Re-extract keywords
              </>
            )}
          </button>
        </div>
      </div>

      {lastResult && (
        <div className="mp-admin__last-run">
          <div className="mp-admin__last-run-head">
            <span className="mp-admin__last-run-badge">
              {lastResult.kind === 'scrape' ? 'Scrape' : 'Re-extract'}
            </span>
            <span>
              {new Date(lastResult.startedAt).toLocaleString('vi-VN')} →{' '}
              {new Date(lastResult.finishedAt).toLocaleString('vi-VN')}
            </span>
          </div>
          <div className="mp-admin__stats">
            <StatTile label="Jobs fetched" value={lastResult.jobsFetched} />
            <StatTile label="Inserted" value={lastResult.jobsInserted} />
            <StatTile label="Updated" value={lastResult.jobsUpdated} />
            <StatTile label="Mentions" value={lastResult.mentionsCreated} />
            <StatTile label="Snapshots" value={lastResult.snapshotsCreated} />
            <StatTile label="Errors" value={lastResult.errors?.length || 0} />
          </div>
          {lastResult.errors?.length > 0 && (
            <details className="mp-admin__errors">
              <summary>Lỗi ({lastResult.errors.length})</summary>
              <ul>
                {lastResult.errors.slice(0, 20).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div key={reloadKey} className="mp-admin__data">
        <MarketPulsePage embedded />
      </div>
    </div>
  );
}
