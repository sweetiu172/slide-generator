"use client";

const PRESETS = [
  { label: "60:40", value: 0.6 },
  { label: "65:35", value: 0.65 },
  { label: "70:30", value: 0.7 },
];

interface LayoutSelectorProps {
  ratio: number;
  onChange: (ratio: number) => void;
}

export default function LayoutSelector({
  ratio,
  onChange,
}: LayoutSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Text : Image Ratio
      </label>
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              ratio === preset.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
