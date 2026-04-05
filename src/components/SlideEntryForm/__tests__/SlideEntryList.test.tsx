import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlideEntryList from "../SlideEntryList";
import type { SlideEntry } from "@/lib/types";

vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false,
  })),
}));

const mockEntries: SlideEntry[] = [
  { id: "1", text: "First entry", imageFile: null, imageDataUrl: null },
  { id: "2", text: "Second entry", imageFile: null, imageDataUrl: null },
];

describe("SlideEntryList", () => {
  it("renders one form per entry", () => {
    render(
      <SlideEntryList
        entries={mockEntries}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByText("Slide Entry 1")).toBeInTheDocument();
    expect(screen.getByText("Slide Entry 2")).toBeInTheDocument();
  });

  it("renders add button", () => {
    render(
      <SlideEntryList
        entries={mockEntries}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByText("+ Add Slide Entry")).toBeInTheDocument();
  });

  it("calls onAdd when add button clicked", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <SlideEntryList
        entries={mockEntries}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
        onAdd={onAdd}
      />
    );

    await user.click(screen.getByText("+ Add Slide Entry"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
