"use client";

export default function Ruler() {
  const ticks = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="flex justify-center px-4">
      <div className="relative h-8 w-full max-w-[210mm] border-b border-gray-200 bg-gray-50">
        <div className="absolute inset-0 flex items-end justify-between px-2">
          {ticks.map((tick) => (
            <div
              key={tick}
              className="relative flex flex-col items-center"
            >
              <span className="text-xs text-gray-400">{tick}</span>
              <div className="mt-1 h-2 w-px bg-gray-300" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-8 right-8 h-px bg-gray-400" />
      </div>
    </div>
  );
}
