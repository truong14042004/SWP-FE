import { useEffect, useRef, useState } from 'react';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationApi';
import '../../styles/notification-bell.css';

const POLL_INTERVAL_MS = 30_000;

function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function NotificationBell({ session, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    async function poll() {
      try {
        const result = await getMyNotifications(session, { take: 30 });
        if (!cancelled) {
          setItems(result?.items || []);
          setUnreadCount(result?.unreadCount || 0);
        }
      } catch {
        // silent fail — bell không nên gây toast lỗi
      }
    }

    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [session]);

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function refresh() {
    setLoading(true);
    try {
      const result = await getMyNotifications(session, { take: 30 });
      setItems(result?.items || []);
      setUnreadCount(result?.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }

  async function handleClickNotification(notification) {
    if (!notification.isRead) {
      try {
        await markNotificationRead(session, notification.id);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // ignore
      }
    }

    if (notification.linkUrl && onNavigate) {
      const target = notification.linkUrl.replace(/^#/, '');
      onNavigate(target);
    }

    setOpen(false);
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead(session);
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-button"
        aria-label="Thông báo"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) refresh();
        }}
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <header>
            <strong>Thông báo</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={handleMarkAllRead}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </header>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">Đang tải...</div>
            ) : items.length === 0 ? (
              <div className="notification-empty">
                <span>📭</span>
                <p>Chưa có thông báo nào</p>
              </div>
            ) : (
              items.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                  onClick={() => handleClickNotification(notification)}
                >
                  <div className="notification-icon">
                    {iconForType(notification.type)}
                  </div>
                  <div className="notification-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{timeAgo(notification.createdAt)}</small>
                  </div>
                  {!notification.isRead && <span className="notification-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function iconForType(type) {
  switch (type) {
    case 'RoadmapReviewApproved': return '✅';
    case 'RoadmapReviewRejected': return '❌';
    case 'RoadmapReviewRequested': return '📥';
    case 'RoadmapCompleted': return '🎉';
    default: return '🔔';
  }
}
