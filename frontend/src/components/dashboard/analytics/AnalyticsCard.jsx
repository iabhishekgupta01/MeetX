import React, { useEffect, useMemo, useState } from "react";
import styles from "./AnalyticsCard.module.css";

const getValueSpec = (rawValue) => {
  const value = String(rawValue || "").trim();

  if (/^\d+$/.test(value)) {
    return { type: "number", target: Number(value) };
  }

  if (/^\d+%$/.test(value)) {
    return { type: "percent", target: Number(value.replace("%", "")) };
  }

  const hourMinuteMatch = value.match(/^(\d+)h(?:\s+(\d+)m)?$/i);
  if (hourMinuteMatch) {
    const hours = Number(hourMinuteMatch[1]);
    const minutes = Number(hourMinuteMatch[2] || 0);
    return { type: "duration", target: (hours * 60) + minutes };
  }

  const minuteMatch = value.match(/^(\d+)m$/i);
  if (minuteMatch) {
    return { type: "duration", target: Number(minuteMatch[1]) };
  }

  return { type: "text", target: value };
};

const formatAnimatedValue = (type, currentValue) => {
  const rounded = Math.max(0, Math.round(currentValue));

  if (type === "number") return String(rounded);
  if (type === "percent") return `${rounded}%`;
  if (type === "duration") {
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return String(currentValue);
};

function AnalyticsCard({ title, value, description, icon, tone = "blue" }) {
  const [displayValue, setDisplayValue] = useState(String(value || ""));

  const valueSpec = useMemo(() => getValueSpec(value), [value]);

  useEffect(() => {
    if (valueSpec.type === "text") {
      setDisplayValue(String(valueSpec.target));
      return;
    }

    const animationDuration = 650;
    let frameId = 0;
    const startAt = performance.now();

    const tick = (timestamp) => {
      const progress = Math.min(1, (timestamp - startAt) / animationDuration);
      const eased = 1 - ((1 - progress) ** 3);
      const nextValue = valueSpec.target * eased;
      setDisplayValue(formatAnimatedValue(valueSpec.type, nextValue));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [valueSpec]);

  const toneClass =
    tone === "green"
      ? styles.toneGreen
      : tone === "amber"
        ? styles.toneAmber
        : tone === "violet"
          ? styles.toneViolet
          : styles.toneBlue;

  return (
    <article className={`${styles.card} ${toneClass}`}>
      <div className={styles.topRow}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className={styles.value}>{displayValue}</p>
      <p className={styles.description}>{description}</p>
    </article>
  );
}

export default AnalyticsCard;
