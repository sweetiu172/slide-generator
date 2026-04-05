import { describe, it, expect, vi, beforeEach } from "vitest";

vi.stubEnv("PIPER_URL", "http://test-piper:5000");

describe("GET /api/tts/voices", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns voice list from upstream", async () => {
    const mockVoices = [
      { id: "en_US-lessac-medium", name: "lessac (medium)", language: "en_US" },
    ];
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockVoices),
    })));

    const { GET } = await import("../route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockVoices);
  });

  it("returns upstream error status", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: false,
      status: 500,
    })));

    const { GET } = await import("../route");
    const response = await GET();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to fetch voices");
  });

  it("returns 503 when upstream is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("ECONNREFUSED"))));

    const { GET } = await import("../route");
    const response = await GET();

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe("TTS service unavailable");
  });
});
