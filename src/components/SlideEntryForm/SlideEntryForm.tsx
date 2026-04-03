"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { SlideEntry } from "@/lib/types";

interface SlideEntryFormProps {
  entry: SlideEntry;
  index: number;
  canRemove: boolean;
  onTextChange: (id: string, text: string) => void;
  onImageChange: (id: string, file: File | null) => void;
  onRemove: (id: string) => void;
}

export default function SlideEntryForm({
  entry,
  index,
  canRemove,
  onTextChange,
  onImageChange,
  onRemove,
}: SlideEntryFormProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageChange(entry.id, acceptedFiles[0]);
      }
    },
    [entry.id, onImageChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  const wordCount = entry.text
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4 bg-white">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Slide Entry {index + 1}</h3>
        {canRemove && (
          <button
            onClick={() => onRemove(entry.id)}
            className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      {/* Text input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text
        </label>
        <textarea
          value={entry.text}
          onChange={(e) => onTextChange(entry.id, e.target.value)}
          placeholder="Paste your long text here. It will be automatically split across slides..."
          className="w-full h-40 p-3 border border-gray-300 rounded-md resize-y text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          {wordCount} words
          {wordCount > 120 &&
            ` (~${Math.ceil(wordCount / 120)} slides)`}
        </p>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image (optional)
        </label>
        {entry.imageDataUrl ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.imageDataUrl}
              alt="Uploaded"
              className="h-24 rounded-md object-cover"
            />
            <button
              onClick={() => onImageChange(entry.id, null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs cursor-pointer hover:bg-red-600"
            >
              x
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-sm text-gray-500">
              {isDragActive
                ? "Drop image here..."
                : "Drag & drop an image, or click to select"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
