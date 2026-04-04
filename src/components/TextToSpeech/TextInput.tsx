"use client";

const CHAR_WARNING = 5000;

interface TextInputProps {
  text: string;
  onChange: (text: string) => void;
}

export default function TextInput({ text, onChange }: TextInputProps) {
  const charCount = text.length;
  const isOverWarning = charCount > CHAR_WARNING;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Text
      </label>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter the text you want to convert to speech..."
        className="w-full h-64 p-3 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="flex justify-end mt-1">
        <span
          className={`text-xs ${
            isOverWarning ? "text-amber-600 font-medium" : "text-gray-400"
          }`}
        >
          {charCount.toLocaleString()} characters
          {isOverWarning && " — long text may take a while to generate"}
        </span>
      </div>
    </div>
  );
}
