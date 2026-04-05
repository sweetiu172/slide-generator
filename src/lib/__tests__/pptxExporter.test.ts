import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pptxgenjs - use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockAddText, mockAddImage, mockAddSlide, mockWrite } = vi.hoisted(() => {
  const mockAddText = vi.fn();
  const mockAddImage = vi.fn();
  const mockAddSlide = vi.fn(() => ({
    background: {},
    addText: mockAddText,
    addImage: mockAddImage,
  }));
  const mockWrite = vi.fn(() => Promise.resolve(new ArrayBuffer(100)));
  return { mockAddText, mockAddImage, mockAddSlide, mockWrite };
});

vi.mock("pptxgenjs", () => {
  class MockPptxGenJS {
    layout = "";
    author = "";
    title = "";
    addSlide = mockAddSlide;
    write = mockWrite;
  }
  return { default: MockPptxGenJS };
});

// Mock jszip
const { mockZipFile, mockZipFolder, mockZipFilter, mockZipGenerateAsync } = vi.hoisted(() => {
  const mockZipFile = vi.fn();
  const mockZipFolder = vi.fn(() => ({
    forEach: vi.fn(),
  }));
  const mockZipFilter = vi.fn(() => []);
  const mockZipGenerateAsync = vi.fn(() => Promise.resolve(new Blob(["test"])));
  return { mockZipFile, mockZipFolder, mockZipFilter, mockZipGenerateAsync };
});

vi.mock("jszip", () => ({
  loadAsync: vi.fn(() =>
    Promise.resolve({
      file: mockZipFile.mockImplementation((name: string, content?: string) => {
        if (content !== undefined) return undefined;
        return {
          async: vi.fn(() => Promise.resolve("<mock-xml/>")),
        };
      }),
      folder: mockZipFolder,
      filter: mockZipFilter,
      generateAsync: mockZipGenerateAsync,
    })
  ),
}));

import { calculateFontSize } from "../pptxExporter";

describe("calculateFontSize", () => {
  it("returns max font size (24) for very short text in large area", () => {
    expect(calculateFontSize("Hello", 10, 7)).toBe(24);
  });

  it("returns minimum font size (10) for extremely long text in small area", () => {
    const longText = Array.from({ length: 500 }, () => "word").join(" ");
    expect(calculateFontSize(longText, 2, 1)).toBe(10);
  });

  it("decreases font size as text length increases", () => {
    const shortText = "Short text here.";
    const longText = Array.from({ length: 100 }, () => "word").join(" ");
    const shortSize = calculateFontSize(shortText, 10, 7);
    const longSize = calculateFontSize(longText, 10, 7);
    expect(shortSize).toBeGreaterThanOrEqual(longSize);
  });

  it("handles text with explicit newlines", () => {
    const text = "Line one\nLine two\nLine three\nLine four";
    const size = calculateFontSize(text, 10, 7);
    expect(size).toBeGreaterThanOrEqual(10);
    expect(size).toBeLessThanOrEqual(24);
  });

  it("handles single-word text", () => {
    expect(calculateFontSize("Hello", 5, 3)).toBe(24);
  });

  it("handles empty lines in text", () => {
    const text = "Line one\n\n\nLine after gaps";
    const size = calculateFontSize(text, 10, 7);
    expect(size).toBeGreaterThanOrEqual(10);
    expect(size).toBeLessThanOrEqual(24);
  });

  it("returns smaller font for narrow area", () => {
    const text = Array.from({ length: 50 }, () => "word").join(" ");
    const wideSize = calculateFontSize(text, 10, 5);
    const narrowSize = calculateFontSize(text, 3, 5);
    expect(wideSize).toBeGreaterThanOrEqual(narrowSize);
  });

  it("returns smaller font for short area", () => {
    const text = Array.from({ length: 50 }, () => "word").join(" ");
    const tallSize = calculateFontSize(text, 10, 7);
    const shortSize = calculateFontSize(text, 10, 2);
    expect(tallSize).toBeGreaterThanOrEqual(shortSize);
  });
});

describe("exportToPptx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:test"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("creates slides and triggers download", async () => {
    const { exportToPptx } = await import("../pptxExporter");

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement
    );

    const slides = [
      {
        id: "1",
        entryId: "e1",
        text: "Hello World",
        imageDataUrl: null,
        slideIndex: 0,
      },
    ];

    await exportToPptx(slides, 0.65, "test");

    expect(mockAddSlide).toHaveBeenCalledTimes(1);
    expect(mockAddText).toHaveBeenCalledTimes(1);
    expect(mockAddImage).not.toHaveBeenCalled();
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAnchor.download).toBe("test.pptx");
  });

  it("adds image when imageDataUrl is present", async () => {
    const { exportToPptx } = await import("../pptxExporter");

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement
    );

    const slides = [
      {
        id: "1",
        entryId: "e1",
        text: "Hello with image",
        imageDataUrl: "data:image/png;base64,abc",
        slideIndex: 0,
      },
    ];

    await exportToPptx(slides, 0.65, "test");

    expect(mockAddImage).toHaveBeenCalledTimes(1);
    expect(mockAddImage).toHaveBeenCalledWith(
      expect.objectContaining({
        data: "data:image/png;base64,abc",
      })
    );
  });

  it("creates multiple slides for multiple entries", async () => {
    const { exportToPptx } = await import("../pptxExporter");

    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, "appendChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement
    );
    vi.spyOn(document.body, "removeChild").mockImplementation(
      () => mockAnchor as unknown as HTMLElement
    );

    const slides = [
      { id: "1", entryId: "e1", text: "Slide 1", imageDataUrl: null, slideIndex: 0 },
      { id: "2", entryId: "e1", text: "Slide 2", imageDataUrl: null, slideIndex: 1 },
      { id: "3", entryId: "e1", text: "Slide 3", imageDataUrl: null, slideIndex: 2 },
    ];

    await exportToPptx(slides, 0.65);

    expect(mockAddSlide).toHaveBeenCalledTimes(3);
    expect(mockAddText).toHaveBeenCalledTimes(3);
  });
});
