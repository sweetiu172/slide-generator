"use client";

import { useState } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  onDownload: (format: "wav" | "mp3") => void;
  isDownloading?: boolean;
}

export default function AudioPlayer({
  audioUrl,
  onDownload,
  isDownloading,
}: AudioPlayerProps) {
  const [format, setFormat] = useState<"wav" | "mp3">("wav");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Preview
      </label>

      <audio controls src={audioUrl} className="w-full" />

      <div className="flex items-center gap-3">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as "wav" | "mp3")}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="wav">WAV (Lossless)</option>
          <option value="mp3">MP3 (192kbps)</option>
        </select>

        <button
          onClick={() => onDownload(format)}
          disabled={isDownloading}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isDownloading ? "Downloading..." : "Download"}
        </button>
      </div>
    </div>
  );
}
