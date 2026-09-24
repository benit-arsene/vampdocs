"use client";

import { PAGE_MARGIN_MM, PAGE_WIDTH_MM } from "./pagination";

/** Short ticks every half centimetre, long ticks every centimetre. */
const TICK_STEP_MM = 5;
const TICKS = Array.from(
  { length: PAGE_WIDTH_MM / TICK_STEP_MM + 1 },
  (_, index) => index * TICK_STEP_MM,
);
const LABELS = Array.from(
  { length: PAGE_WIDTH_MM / 10 - 1 },
  (_, index) => (index + 1) * 10,
);

export default function Ruler() {
  return (
    <div className="ruler flex justify-center border-b border-gray-200 bg-gray-50 px-4">
      <div
        className="relative ruler-track"
        style={{ width: `${PAGE_WIDTH_MM}mm` }}
      >
        {/* Margins of the text area, so the printable width is obvious. */}
        <div
          className="ruler-margin-zone left-0"
          style={{ width: `${PAGE_MARGIN_MM}mm` }}
        />
        <div
          className="ruler-margin-zone right-0"
          style={{ width: `${PAGE_MARGIN_MM}mm` }}
        />

        {TICKS.map((position) => {
          const isCentimetre = position % 10 === 0;

          return (
            <div
              key={position}
              className={`absolute bottom-0 border-l ${
                isCentimetre
                  ? "ruler-tick-long"
                  : "ruler-tick-short"
              }`}
              style={{ left: `${position}mm` }}
            />
          );
        })}

        {LABELS.map((position) => (
          <span
            key={position}
            className="ruler-label"
            style={{ left: `${position}mm` }}
          >
            {position / 10}
          </span>
        ))}
      </div>
    </div>
  );
}