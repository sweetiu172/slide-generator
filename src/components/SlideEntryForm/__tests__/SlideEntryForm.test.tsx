import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SlideEntryForm from "../SlideEntryForm";
import type { SlideEntry } from "@/lib/types";

vi.mock("react-dropzone", () => ({
  useDropzone: vi.fn(({ onDrop }: { onDrop: (files: File[]) => void }) => ({
    getRootProps: () => ({
      onClick: () => {
        const file = new File(["test"], "test.png", { type: "image/png" });
        onDrop([file]);
      },
    }),
    getInputProps: () => ({}),
    isDragActive: false,
  })),
}));

const defaultEntry: SlideEntry = {
  id: "entry-1",
  text: "",
  imageFile: null,
  imageDataUrl: null,
};

describe("SlideEntryForm", () => {
  it("renders textarea and word count", () => {
    render(
      <SlideEntryForm
        entry={defaultEntry}
        index={0}
        canRemove={false}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Slide Entry 1")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste your long text/)).toBeInTheDocument();
    expect(screen.getByText("0 words")).toBeInTheDocument();
  });

  it("calls onTextChange when typing", async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(
      <SlideEntryForm
        entry={defaultEntry}
        index={0}
        canRemove={false}
        onTextChange={onTextChange}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText(/Paste your long text/), "H");
    expect(onTextChange).toHaveBeenCalledWith("entry-1", "H");
  });

  it("shows remove button when canRemove is true", () => {
    render(
      <SlideEntryForm
        entry={defaultEntry}
        index={0}
        canRemove={true}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("Remove")).toBeInTheDocument();
  });

  it("hides remove button when canRemove is false", () => {
    render(
      <SlideEntryForm
        entry={defaultEntry}
        index={0}
        canRemove={false}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <SlideEntryForm
        entry={defaultEntry}
        index={0}
        canRemove={true}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={onRemove}
      />
    );

    await user.click(screen.getByText("Remove"));
    expect(onRemove).toHaveBeenCalledWith("entry-1");
  });

  it("shows image preview when imageDataUrl is set", () => {
    const entryWithImage: SlideEntry = {
      ...defaultEntry,
      imageDataUrl: "data:image/png;base64,abc",
    };
    render(
      <SlideEntryForm
        entry={entryWithImage}
        index={0}
        canRemove={false}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByAltText("Uploaded")).toBeInTheDocument();
  });

  it("shows word count for text with words", () => {
    const entryWithText: SlideEntry = {
      ...defaultEntry,
      text: "Hello world test",
    };
    render(
      <SlideEntryForm
        entry={entryWithText}
        index={0}
        canRemove={false}
        onTextChange={vi.fn()}
        onImageChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("3 words")).toBeInTheDocument();
  });
});
