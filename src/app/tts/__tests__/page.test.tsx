import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TTSPage from "../page";

const mockTTSHook = {
  text: "",
  settings: {
    voice: "en_US-lessac-medium",
    lengthScale: 1.0,
    noiseScale: 0.667,
    noiseW: 0.8,
  },
  voices: [],
  isLoadingVoices: false,
  isGenerating: false,
  audioUrl: null,
  audioBlob: null,
  error: null,
  setText: vi.fn(),
  setVoice: vi.fn(),
  setLengthScale: vi.fn(),
  setNoiseScale: vi.fn(),
  setNoiseW: vi.fn(),
  generate: vi.fn(),
  downloadAudio: vi.fn(),
  reset: vi.fn(),
};

vi.mock("@/hooks/useTTS", () => ({
  useTTS: () => mockTTSHook,
}));

describe("TTS Page", () => {
  it("renders navigation and text input", () => {
    render(<TTSPage />);
    expect(screen.getByText("Text to Speech")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter the text you want to convert/)
    ).toBeInTheDocument();
  });

  it("renders voice selector and generate button", () => {
    render(<TTSPage />);
    expect(screen.getByText("Generate Speech")).toBeInTheDocument();
    expect(screen.getByText("Voice Settings")).toBeInTheDocument();
  });

  it("disables generate button when no text", () => {
    render(<TTSPage />);
    expect(screen.getByText("Generate Speech").closest("button")).toBeDisabled();
  });

  it("shows audio player when audioUrl is set", () => {
    mockTTSHook.audioUrl = "blob:test-audio";
    render(<TTSPage />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Start Over")).toBeInTheDocument();
    mockTTSHook.audioUrl = null;
  });

  it("shows error message when error is set", () => {
    mockTTSHook.error = "Something went wrong";
    render(<TTSPage />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    mockTTSHook.error = null;
  });

  it("calls reset when Start Over clicked", async () => {
    const user = userEvent.setup();
    mockTTSHook.audioUrl = "blob:test";
    render(<TTSPage />);

    await user.click(screen.getByText("Start Over"));
    expect(mockTTSHook.reset).toHaveBeenCalled();
    mockTTSHook.audioUrl = null;
  });
});
