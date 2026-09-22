"use client";

export default function Ruler() {
  const ticks = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="relative h-8 border-b border-gray-200 bg-gray-50">
      <div className="relative h-full w-full max-w-3xl px-8">
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {ticks.map((tick) => (
            <div key={tick} className="relative flex flex-col items-center">
              <span className="text-xs text-gray-400">{tick}</span>
              <div className="mt-1 h-2 w-px bg-gray-300" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-8 right-8 h-px bg-gray-400" />

        <div className="absolute bottom-1 left-2 flex gap-1">
          <div className="h-4 w-3 border-l-2 border-gray-400" />
        </div>
        <div className="absolute bottom-1 right-2 flex gap-1">
          <div className="h-4 w-3 border-r-2 border-gray-400" />
        </div>
      </div>
    </div>
  );
}
