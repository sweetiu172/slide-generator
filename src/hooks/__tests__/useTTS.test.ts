import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTTS } from "../useTTS";

describe("useTTS", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test-audio-url"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("initializes with default state", () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })));

    const { result } = renderHook(() => useTTS());
    expect(result.current.text).toBe("");
    expect(result.current.settings.voice).toBe("en_US-lessac-medium");
    expect(result.current.settings.lengthScale).toBe(1.0);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.audioUrl).toBeNull();
  });

  it("fetches voices on mount", async () => {
    const mockVoices = [
      { id: "en_US-lessac-medium", name: "lessac", language: "en_US" },
      { id: "en_US-ryan-medium", name: "ryan", language: "en_US" },
    ];
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVoices),
    })));

    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(result.current.isLoadingVoices).toBe(false);
    });
    expect(result.current.voices).toEqual(mockVoices);
  });

  it("sets error when voice fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));

    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(result.current.isLoadingVoices).toBe(false);
    });
    expect(result.current.error).toContain("Could not load voices");
  });

  it("auto-selects first voice when default is not in list", async () => {
    const mockVoices = [
      { id: "custom-voice", name: "custom", language: "en" },
    ];
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVoices),
    })));

    const { result } = renderHook(() => useTTS());

    await waitFor(() => {
      expect(result.current.isLoadingVoices).toBe(false);
    });
    expect(result.current.settings.voice).toBe("custom-voice");
  });

  it("updates text", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })));

    const { result } = renderHook(() => useTTS());
    act(() => result.current.setText("Hello world"));
    expect(result.current.text).toBe("Hello world");
  });

  it("updates voice setting", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })));

    const { result } = renderHook(() => useTTS());
    act(() => result.current.setVoice("en_US-ryan-medium"));
    expect(result.current.settings.voice).toBe("en_US-ryan-medium");
  });

  it("updates scale settings", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })));

    const { result } = renderHook(() => useTTS());
    act(() => result.current.setLengthScale(1.5));
    act(() => result.current.setNoiseScale(0.5));
    act(() => result.current.setNoiseW(0.6));

    expect(result.current.settings.lengthScale).toBe(1.5);
    expect(result.current.settings.noiseScale).toBe(0.5);
    expect(result.current.settings.noiseW).toBe(0.6);
  });

  it("does not generate when text is empty", async () => {
    const fetchMock = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTTS());

    await waitFor(() => expect(result.current.isLoadingVoices).toBe(false));

    await act(async () => {
      await result.current.generate();
    });

    // Only the voice fetch call, no TTS call
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("generates audio successfully", async () => {
    const mockBlob = new Blob(["audio"], { type: "audio/wav" });
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        // Voice fetch
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "en_US-lessac-medium", name: "lessac", language: "en_US" }]),
        });
      }
      // TTS generate
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      });
    }));

    const { result } = renderHook(() => useTTS());
    await waitFor(() => expect(result.current.isLoadingVoices).toBe(false));

    act(() => result.current.setText("Hello world"));

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.audioUrl).toBe("blob:test-audio-url");
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles generation error", async () => {
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      });
    }));

    const { result } = renderHook(() => useTTS());
    await waitFor(() => expect(result.current.isLoadingVoices).toBe(false));

    act(() => result.current.setText("Hello"));

    await act(async () => {
      await result.current.generate();
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.isGenerating).toBe(false);
  });

  it("downloads WAV from existing blob", async () => {
    const mockBlob = new Blob(["audio"], { type: "audio/wav" });
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "en_US-lessac-medium", name: "lessac", language: "en_US" }]),
        });
      }
      return Promise.resolve({ ok: true, blob: () => Promise.resolve(mockBlob) });
    }));

    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor as unknown as HTMLElement;
      return origCreateElement(tag);
    });

    const { result } = renderHook(() => useTTS());
    await waitFor(() => expect(result.current.isLoadingVoices).toBe(false));

    act(() => result.current.setText("Hello"));
    await act(async () => await result.current.generate());

    await act(async () => {
      await result.current.downloadAudio("wav");
    });

    expect(mockAnchor.download).toBe("speech.wav");
    expect(mockAnchor.click).toHaveBeenCalled();
  });

  it("downloads MP3 by fetching from server", async () => {
    const mockBlob = new Blob(["audio"], { type: "audio/wav" });
    const mockMp3Blob = new Blob(["mp3"], { type: "audio/mpeg" });
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: "en_US-lessac-medium", name: "lessac", language: "en_US" }]),
        });
      }
      if (callCount === 2) {
        return Promise.resolve({ ok: true, blob: () => Promise.resolve(mockBlob) });
      }
      return Promise.resolve({ ok: true, blob: () => Promise.resolve(mockMp3Blob) });
    }));

    const mockAnchor = { href: "", download: "", click: vi.fn() };
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor as unknown as HTMLElement;
      return origCreateElement(tag);
    });

    const { result } = renderHook(() => useTTS());
    await waitFor(() => expect(result.current.isLoadingVoices).toBe(false));

    act(() => result.current.setText("Hello"));
    await act(async () => await result.current.generate());

    await act(async () => {
      await result.current.downloadAudio("mp3");
    });

    expect(mockAnchor.download).toBe("speech.mp3");
  });

  it("resets state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })));

    const { result } = renderHook(() => useTTS());
    await waitFor(() => expect(result.current.isLoadingVoices).toBe(false));

    act(() => result.current.setText("Hello"));
    act(() => result.current.reset());

    expect(result.current.text).toBe("");
    expect(result.current.audioUrl).toBeNull();
  });
});
