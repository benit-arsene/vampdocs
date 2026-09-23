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
        className="relative h-6 overflow-hidden"
        style={{ width: `${PAGE_WIDTH_MM}mm` }}
      >
        {/* Margins of the text area, so the printable width is obvious. */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-200/80"
          style={{ width: `${PAGE_MARGIN_MM}mm` }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-gray-200/80"
          style={{ width: `${PAGE_MARGIN_MM}mm` }}
        />

        {TICKS.map((position) => {
          const isCentimetre = position % 10 === 0;

          return (
            <div
              key={position}
              className={`absolute bottom-0 border-l ${
                isCentimetre
                  ? "h-3 border-gray-400"
                  : "h-1.5 border-gray-300"
              }`}
              style={{ left: `${position}mm` }}
            />
          );
        })}

        {LABELS.map((position) => (
          <span
            key={position}
            className="absolute top-0 -translate-x-1/2 text-[10px] leading-none text-gray-400"
            style={{ left: `${position}mm` }}
          >
            {position / 10}
          </span>
        ))}
      </div>
    </div>
  );
}
