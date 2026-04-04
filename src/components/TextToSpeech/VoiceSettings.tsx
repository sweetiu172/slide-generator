"use client";

import { useState } from "react";

interface VoiceSettingsProps {
  lengthScale: number;
  noiseScale: number;
  noiseW: number;
  onLengthScaleChange: (value: number) => void;
  onNoiseScaleChange: (value: number) => void;
  onNoiseWChange: (value: number) => void;
}

function SliderControl({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500 tabular-nums">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}

export default function VoiceSettings({
  lengthScale,
  noiseScale,
  noiseW,
  onLengthScaleChange,
  onNoiseScaleChange,
  onNoiseWChange,
}: VoiceSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <span>Voice Settings</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <SliderControl
            label="Speed"
            description="Lower = faster, higher = slower"
            value={lengthScale}
            min={0.5}
            max={2.0}
            step={0.05}
            onChange={onLengthScaleChange}
          />
          <SliderControl
            label="Stability"
            description="Lower = monotone, higher = expressive"
            value={noiseScale}
            min={0}
            max={1}
            step={0.01}
            onChange={onNoiseScaleChange}
          />
          <SliderControl
            label="Style"
            description="Lower = robotic rhythm, higher = natural"
            value={noiseW}
            min={0}
            max={1}
            step={0.01}
            onChange={onNoiseWChange}
          />
        </div>
      )}
    </div>
  );
}
