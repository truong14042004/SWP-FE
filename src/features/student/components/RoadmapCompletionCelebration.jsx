import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { X } from 'lucide-react';
import '../../../styles/roadmap-celebration.css';

gsap.registerPlugin(useGSAP);

const CONFETTI_COLORS = ['#ff5e5b', '#ffd93d', '#6bcb77', '#4d96ff', '#c780fa', '#ff9f45'];
const CONFETTI_COUNT = 48;
const CONFETTI_PIECES = Array.from({ length: CONFETTI_COUNT }, (_, index) => index);

export function RoadmapCompletionCelebration({ open, roadmapTitle, onClose }) {
  const scopeRef = useRef(null);
  const cardRef = useRef(null);

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useGSAP(
    () => {
      if (!open) return;

      gsap.fromTo(
        cardRef.current,
        { scale: 0.6, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.7)' }
      );

      const pieces = gsap.utils.toArray('.roadmap-celebration-confetti span');
      pieces.forEach((piece) => {
        gsap.set(piece, { x: 0, y: 0, opacity: 1, rotation: 0 });
        gsap.to(piece, {
          x: gsap.utils.random(-280, 280),
          y: gsap.utils.random(-240, 280),
          rotation: gsap.utils.random(-360, 360),
          opacity: 0,
          duration: gsap.utils.random(1.1, 2.1),
          ease: 'power2.out',
          delay: gsap.utils.random(0, 0.25),
        });
      });
    },
    { scope: scopeRef, dependencies: [open] }
  );

  if (!open) return null;

  return (
    <div
      className="roadmap-celebration-overlay"
      ref={scopeRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="roadmap-celebration-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="roadmap-celebration-confetti" aria-hidden="true">
        {CONFETTI_PIECES.map((piece) => (
          <span
            key={piece}
            style={{ background: CONFETTI_COLORS[piece % CONFETTI_COLORS.length] }}
          />
        ))}
      </div>

      <div className="roadmap-celebration-card" ref={cardRef}>
        <button
          type="button"
          className="roadmap-celebration-close"
          aria-label="Đóng"
          onClick={() => onClose?.()}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="roadmap-celebration-emoji" aria-hidden="true">🎉</div>
        <h2 id="roadmap-celebration-title">Chúc mừng!</h2>
        <p>Bạn đã hoàn thành toàn bộ module trong lộ trình</p>
        {roadmapTitle && (
          <strong className="roadmap-celebration-roadmap">{roadmapTitle}</strong>
        )}
        <p className="roadmap-celebration-sub">
          Thành quả tuyệt vời. Tiếp tục chinh phục những mục tiêu mới nhé!
        </p>

        <button
          type="button"
          className="roadmap-celebration-cta"
          onClick={() => onClose?.()}
        >
          Tuyệt vời!
        </button>
      </div>
    </div>
  );
}
