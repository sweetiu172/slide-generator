"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import type { TTSVoice, TTSSettings } from "@/lib/types";

interface State {
  text: string;
  settings: TTSSettings;
  voices: TTSVoice[];
  isLoadingVoices: boolean;
  isGenerating: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  error: string | null;
}

type Action =
  | { type: "SET_TEXT"; text: string }
  | { type: "SET_VOICE"; voice: string }
  | { type: "SET_LENGTH_SCALE"; value: number }
  | { type: "SET_NOISE_SCALE"; value: number }
  | { type: "SET_NOISE_W"; value: number }
  | { type: "SET_VOICES"; voices: TTSVoice[] }
  | { type: "SET_VOICES_ERROR"; error: string }
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; audioUrl: string; audioBlob: Blob }
  | { type: "GENERATE_ERROR"; error: string }
  | { type: "RESET" };

const defaultSettings: TTSSettings = {
  voice: "en_US-lessac-medium",
  lengthScale: 1.0,
  noiseScale: 0.667,
  noiseW: 0.8,
};

const initialState: State = {
  text: "",
  settings: defaultSettings,
  voices: [],
  isLoadingVoices: true,
  isGenerating: false,
  audioUrl: null,
  audioBlob: null,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_TEXT":
      return { ...state, text: action.text };

    case "SET_VOICE":
      return {
        ...state,
        settings: { ...state.settings, voice: action.voice },
      };

    case "SET_LENGTH_SCALE":
      return {
        ...state,
        settings: { ...state.settings, lengthScale: action.value },
      };

    case "SET_NOISE_SCALE":
      return {
        ...state,
        settings: { ...state.settings, noiseScale: action.value },
      };

    case "SET_NOISE_W":
      return {
        ...state,
        settings: { ...state.settings, noiseW: action.value },
      };

    case "SET_VOICES":
      return {
        ...state,
        voices: action.voices,
        isLoadingVoices: false,
        // Set default voice to first available if current isn't in the list
        settings:
          action.voices.length > 0 &&
          !action.voices.some((v) => v.id === state.settings.voice)
            ? { ...state.settings, voice: action.voices[0].id }
            : state.settings,
      };

    case "SET_VOICES_ERROR":
      return {
        ...state,
        isLoadingVoices: false,
        error: action.error,
      };

    case "GENERATE_START":
      return { ...state, isGenerating: true, error: null };

    case "GENERATE_SUCCESS":
      return {
        ...state,
        isGenerating: false,
        audioUrl: action.audioUrl,
        audioBlob: action.audioBlob,
        error: null,
      };

    case "GENERATE_ERROR":
      return {
        ...state,
        isGenerating: false,
        error: action.error,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useTTS() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const audioUrlRef = useRef<string | null>(null);

  // Revoke previous audio URL when a new one is created
  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // Fetch available voices on mount
  useEffect(() => {
    async function fetchVoices() {
      try {
        const res = await fetch("/api/tts/voices");
        if (!res.ok) throw new Error("Failed to fetch voices");
        const voices: TTSVoice[] = await res.json();
        dispatch({ type: "SET_VOICES", voices });
      } catch {
        dispatch({
          type: "SET_VOICES_ERROR",
          error: "Could not load voices. Is the TTS service running?",
        });
      }
    }
    fetchVoices();
  }, []);

  const setText = useCallback(
    (text: string) => dispatch({ type: "SET_TEXT", text }),
    [],
  );

  const setVoice = useCallback(
    (voice: string) => dispatch({ type: "SET_VOICE", voice }),
    [],
  );

  const setLengthScale = useCallback(
    (value: number) => dispatch({ type: "SET_LENGTH_SCALE", value }),
    [],
  );

  const setNoiseScale = useCallback(
    (value: number) => dispatch({ type: "SET_NOISE_SCALE", value }),
    [],
  );

  const setNoiseW = useCallback(
    (value: number) => dispatch({ type: "SET_NOISE_W", value }),
    [],
  );

  const generate = useCallback(async () => {
    if (!state.text.trim()) return;

    dispatch({ type: "GENERATE_START" });
    revokeAudioUrl();

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: state.text,
          voice: state.settings.voice,
          length_scale: state.settings.lengthScale,
          noise_scale: state.settings.noiseScale,
          noise_w: state.settings.noiseW,
          format: "wav",
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(error.error || "Generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      dispatch({ type: "GENERATE_SUCCESS", audioUrl: url, audioBlob: blob });
    } catch (e) {
      dispatch({
        type: "GENERATE_ERROR",
        error: e instanceof Error ? e.message : "Generation failed",
      });
    }
  }, [state.text, state.settings, revokeAudioUrl]);

  const downloadAudio = useCallback(
    async (format: "wav" | "mp3" = "wav") => {
      if (format === "wav" && state.audioBlob) {
        // WAV is already available from generation
        const url = URL.createObjectURL(state.audioBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "speech.wav";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (format === "mp3") {
        // Request MP3 from the server
        try {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: state.text,
              voice: state.settings.voice,
              length_scale: state.settings.lengthScale,
              noise_scale: state.settings.noiseScale,
              noise_w: state.settings.noiseW,
              format: "mp3",
            }),
          });

          if (!res.ok) throw new Error("MP3 export failed");

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "speech.mp3";
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          dispatch({
            type: "GENERATE_ERROR",
            error: e instanceof Error ? e.message : "Download failed",
          });
        }
      }
    },
    [state.audioBlob, state.text, state.settings],
  );

  const reset = useCallback(() => {
    revokeAudioUrl();
    dispatch({ type: "RESET" });
  }, [revokeAudioUrl]);

  return {
    ...state,
    setText,
    setVoice,
    setLengthScale,
    setNoiseScale,
    setNoiseW,
    generate,
    downloadAudio,
    reset,
  };
}
