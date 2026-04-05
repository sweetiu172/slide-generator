import { describe, it, expect, vi, beforeEach } from "vitest";

// Must set env before importing the route
vi.stubEnv("PIPER_URL", "http://test-piper:5000");

describe("POST /api/tts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("proxies request to piper TTS and returns audio", async () => {
    const mockAudioBody = new ReadableStream();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      body: mockAudioBody,
      headers: new Headers({ "Content-Type": "audio/wav" }),
    })));

    const { POST } = await import("../route");
    const request = new Request("http://localhost/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello", voice: "en_US-lessac-medium" }),
    });

    const response = await POST(request);

    expect(response.headers.get("Content-Type")).toBe("audio/wav");
    expect(response.headers.get("Content-Disposition")).toContain("speech.wav");
  });

  it("returns mp3 content disposition for mpeg content type", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      body: new ReadableStream(),
      headers: new Headers({ "Content-Type": "audio/mpeg" }),
    })));

    const { POST } = await import("../route");
    const request = new Request("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({ text: "Hello", format: "mp3" }),
    });

    const response = await POST(request);
    expect(response.headers.get("Content-Disposition")).toContain("speech.mp3");
  });

  it("returns error when upstream fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Internal error" }),
    })));

    const { POST } = await import("../route");
    const request = new Request("http://localhost/api/tts", {
      method: "POST",
      body: JSON.stringify({ text: "Hello" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal error");
  });
});
