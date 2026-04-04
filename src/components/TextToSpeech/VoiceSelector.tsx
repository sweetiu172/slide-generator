"use client";

import type { TTSVoice } from "@/lib/types";

interface VoiceSelectorProps {
  voices: TTSVoice[];
  selectedVoice: string;
  onChange: (voiceId: string) => void;
  isLoading: boolean;
}

export default function VoiceSelector({
  voices,
  selectedVoice,
  onChange,
  isLoading,
}: VoiceSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Voice
      </label>
      <select
        value={selectedVoice}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading || voices.length === 0}
        className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <option>Loading voices...</option>
        ) : voices.length === 0 ? (
          <option>No voices available</option>
        ) : (
          voices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name} — {voice.language}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
