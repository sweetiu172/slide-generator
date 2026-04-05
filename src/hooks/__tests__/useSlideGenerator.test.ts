import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSlideGenerator } from "../useSlideGenerator";

describe("useSlideGenerator", () => {

  it("initializes with one empty entry", () => {
    const { result } = renderHook(() => useSlideGenerator());
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe("");
    expect(result.current.entries[0].imageFile).toBeNull();
    expect(result.current.entries[0].imageDataUrl).toBeNull();
    expect(result.current.isGenerated).toBe(false);
    expect(result.current.layoutRatio).toBe(0.65);
  });

  it("adds a new entry", () => {
    const { result } = renderHook(() => useSlideGenerator());
    act(() => result.current.addEntry());
    expect(result.current.entries).toHaveLength(2);
  });

  it("removes an entry", () => {
    const { result } = renderHook(() => useSlideGenerator());
    act(() => result.current.addEntry());
    expect(result.current.entries).toHaveLength(2);

    const idToRemove = result.current.entries[1].id;
    act(() => result.current.removeEntry(idToRemove));
    expect(result.current.entries).toHaveLength(1);
  });

  it("does not remove the last entry", () => {
    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;
    act(() => result.current.removeEntry(id));
    expect(result.current.entries).toHaveLength(1);
  });

  it("updates entry text", () => {
    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;
    act(() => result.current.updateEntryText(id, "Hello world"));
    expect(result.current.entries[0].text).toBe("Hello world");
    expect(result.current.isGenerated).toBe(false);
  });

  it("clears image when file is null", () => {
    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;
    act(() => result.current.setEntryImage(id, null));
    expect(result.current.entries[0].imageFile).toBeNull();
    expect(result.current.entries[0].imageDataUrl).toBeNull();
  });

  it("reads file and sets image data URL", async () => {
    const mockResult = "data:image/png;base64,abc123";
    let capturedOnload: (() => void) | null = null;

    class MockFileReader {
      result = mockResult;
      onload: (() => void) | null = null;
      readAsDataURL() {
        capturedOnload = this.onload;
      }
    }
    vi.stubGlobal("FileReader", MockFileReader);

    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;
    const file = new File(["test"], "test.png", { type: "image/png" });

    act(() => result.current.setEntryImage(id, file));

    // Simulate FileReader completing
    act(() => {
      capturedOnload?.();
    });

    expect(result.current.entries[0].imageDataUrl).toBe(mockResult);
  });

  it("sets layout ratio", () => {
    const { result } = renderHook(() => useSlideGenerator());
    act(() => result.current.setLayoutRatio(0.7));
    expect(result.current.layoutRatio).toBe(0.7);
  });

  it("generates slides from entry text", () => {
    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;
    act(() => result.current.updateEntryText(id, "This is a test sentence."));
    act(() => result.current.generateSlides());

    expect(result.current.isGenerated).toBe(true);
    expect(result.current.generatedSlides.length).toBeGreaterThan(0);
    expect(result.current.generatedSlides[0].entryId).toBe(id);
    expect(result.current.generatedSlides[0].slideIndex).toBe(0);
  });

  it("skips entries with empty text when generating", () => {
    const { result } = renderHook(() => useSlideGenerator());
    act(() => result.current.addEntry());

    const firstId = result.current.entries[0].id;
    act(() => result.current.updateEntryText(firstId, "Some text here."));
    // Second entry remains empty

    act(() => result.current.generateSlides());
    expect(result.current.generatedSlides.length).toBeGreaterThan(0);
    // All slides should come from first entry
    for (const slide of result.current.generatedSlides) {
      expect(slide.entryId).toBe(firstId);
    }
  });

  it("propagates imageDataUrl to generated slides", () => {
    const mockResult = "data:image/png;base64,abc";
    let capturedOnload: (() => void) | null = null;

    class MockFileReader {
      result = mockResult;
      onload: (() => void) | null = null;
      readAsDataURL() {
        capturedOnload = this.onload;
      }
    }
    vi.stubGlobal("FileReader", MockFileReader);

    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;

    act(() => result.current.updateEntryText(id, "Some text."));
    const file = new File(["test"], "test.png", { type: "image/png" });
    act(() => result.current.setEntryImage(id, file));
    act(() => capturedOnload?.());
    act(() => result.current.generateSlides());

    expect(result.current.generatedSlides[0].imageDataUrl).toBe(mockResult);
  });

  it("resets to initial state", () => {
    const { result } = renderHook(() => useSlideGenerator());
    const id = result.current.entries[0].id;
    act(() => result.current.updateEntryText(id, "Some text."));
    act(() => result.current.generateSlides());
    expect(result.current.isGenerated).toBe(true);

    act(() => result.current.reset());
    expect(result.current.isGenerated).toBe(false);
    expect(result.current.generatedSlides).toHaveLength(0);
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].text).toBe("");
  });
});
