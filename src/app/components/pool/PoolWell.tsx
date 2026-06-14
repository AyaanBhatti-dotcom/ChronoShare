import { useId } from "react";
import { getWellFillProgress } from "../../../lib/community-pool";

interface PoolWellProps {
  totalDonated: number;
  poolBalance: number;
  loading?: boolean;
}

const WELL_DEPTH = 152;
const WELL_BOTTOM = 210;

export function PoolWell({ totalDonated, poolBalance, loading }: PoolWellProps) {
  const clipId = useId();
  const waveGradId = useId();
  const waterGradId = useId();

  const { fill, milestone, prevMilestone } = getWellFillProgress(totalDonated);
  const displayFill = loading ? 0 : fill;
  const waterHeight = WELL_DEPTH * displayFill + 10;
  const waterTop = WELL_BOTTOM - waterHeight;
  const surfaceY = waterTop;

  return (
    <div className="pool-well" aria-hidden={loading}>
      <p className="pool-well-caption">Community well</p>

      <div className="pool-well-vessel">
        <svg viewBox="0 0 200 240" className="pool-well-svg" role="img">
          <title>
            {loading
              ? "Loading community well"
              : `${totalDonated.toFixed(1)} hours donated in total; ${poolBalance.toFixed(1)} hours available now`}
          </title>

          <defs>
            <linearGradient id={waterGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1b8a7a" />
              <stop offset="45%" stopColor="#2dd4c8" />
              <stop offset="100%" stopColor="#7af0e8" />
            </linearGradient>
            <linearGradient id={waveGradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
            <clipPath id={clipId}>
              <path d="M52 58 L148 58 L162 210 Q100 228 38 210 Z" />
            </clipPath>
          </defs>

          <ellipse cx="100" cy="58" rx="52" ry="11" fill="rgba(255,255,255,0.55)" />
          <ellipse cx="100" cy="56" rx="48" ry="9" fill="rgba(6,42,56,0.08)" />
          <path
            d="M48 58 Q100 68 152 58 L162 210 Q100 228 38 210 Z"
            fill="rgba(255,255,255,0.35)"
            stroke="rgba(6,42,56,0.14)"
            strokeWidth="1.5"
          />
          <path d="M58 62 L142 62 L152 200 Q100 214 48 200 Z" fill="rgba(6,42,56,0.04)" />

          <g clipPath={`url(#${clipId})`}>
            <rect
              className="pool-well-water"
              x="36"
              y={surfaceY}
              width="128"
              height={waterHeight}
              fill={`url(#${waterGradId})`}
            />
            {!loading && displayFill > 0.08 && (
              <g className="pool-well-surface" style={{ transform: `translateY(${surfaceY}px)` }}>
                <path
                  className="pool-well-wave pool-well-wave-a"
                  d="M36,0 Q68,-8 100,0 T164,0 L164,14 L36,14 Z"
                  fill={`url(#${waveGradId})`}
                />
                <path
                  className="pool-well-wave pool-well-wave-b"
                  d="M36,0 Q68,8 100,0 T164,0 L164,10 L36,10 Z"
                  fill="rgba(255,255,255,0.22)"
                />
              </g>
            )}
          </g>

          <path
            d="M52 58 L58 62 L48 200 Q100 214 48 200"
            fill="none"
            stroke="rgba(6,42,56,0.06)"
            strokeWidth="3"
          />
          <path
            d="M148 58 L142 62 L152 200 Q100 214 152 200"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="2"
          />
        </svg>

        <div className="pool-well-stats">
          <p className="pool-well-stat-primary">
            {loading ? "—" : totalDonated.toFixed(1)}
            <span className="pool-well-stat-unit">hrs donated</span>
          </p>
          {!loading && (
            <p className="pool-well-stat-secondary">
              {(displayFill * 100).toFixed(0)}% toward {milestone}h
              {prevMilestone > 0 && (
                <span className="pool-well-stat-muted"> · from {prevMilestone}h</span>
              )}
            </p>
          )}
        </div>
      </div>

      <p className="pool-well-balance">
        <span className="pool-well-balance-dot" />
        {loading ? "—" : `${poolBalance.toFixed(1)}h`} available to claim
      </p>
    </div>
  );
}
