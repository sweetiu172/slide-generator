"use client";

import { useTTS } from "@/hooks/useTTS";
import Navigation from "@/components/Navigation/Navigation";
import TextInput from "@/components/TextToSpeech/TextInput";
import VoiceSelector from "@/components/TextToSpeech/VoiceSelector";
import VoiceSettings from "@/components/TextToSpeech/VoiceSettings";
import GenerateButton from "@/components/TextToSpeech/GenerateButton";
import AudioPlayer from "@/components/TextToSpeech/AudioPlayer";

export default function TTSPage() {
  const {
    text,
    settings,
    voices,
    isLoadingVoices,
    isGenerating,
    audioUrl,
    error,
    setText,
    setVoice,
    setLengthScale,
    setNoiseScale,
    setNoiseW,
    generate,
    downloadAudio,
    reset,
  } = useTTS();

  const hasText = text.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Navigation />
          {audioUrl && (
            <button
              onClick={reset}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <TextInput text={text} onChange={setText} />

        <div className="flex flex-wrap items-end gap-6">
          <VoiceSelector
            voices={voices}
            selectedVoice={settings.voice}
            onChange={setVoice}
            isLoading={isLoadingVoices}
          />

          <GenerateButton
            onClick={generate}
            disabled={!hasText}
            isGenerating={isGenerating}
          />
        </div>

        <VoiceSettings
          lengthScale={settings.lengthScale}
          noiseScale={settings.noiseScale}
          noiseW={settings.noiseW}
          onLengthScaleChange={setLengthScale}
          onNoiseScaleChange={setNoiseScale}
          onNoiseWChange={setNoiseW}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {audioUrl && (
          <AudioPlayer audioUrl={audioUrl} onDownload={downloadAudio} />
        )}
      </main>
    </div>
  );
}
