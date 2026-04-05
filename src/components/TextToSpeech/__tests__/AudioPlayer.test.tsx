import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AudioPlayer from "../AudioPlayer";

describe("AudioPlayer", () => {
  it("renders audio element with correct src", () => {
    const { container } = render(
      <AudioPlayer audioUrl="blob:test-audio" onDownload={vi.fn()} />
    );
    const audio = container.querySelector("audio");
    expect(audio).toHaveAttribute("src", "blob:test-audio");
  });

  it("renders format selector with WAV and MP3 options", () => {
    render(
      <AudioPlayer audioUrl="blob:test-audio" onDownload={vi.fn()} />
    );
    expect(screen.getByText("WAV (Lossless)")).toBeInTheDocument();
    expect(screen.getByText("MP3 (192kbps)")).toBeInTheDocument();
  });

  it("calls onDownload with selected format", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(
      <AudioPlayer audioUrl="blob:test-audio" onDownload={onDownload} />
    );

    await user.click(screen.getByText("Download"));
    expect(onDownload).toHaveBeenCalledWith("wav");
  });

  it("calls onDownload with mp3 when mp3 selected", async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    render(
      <AudioPlayer audioUrl="blob:test-audio" onDownload={onDownload} />
    );

    // Select MP3 format
    const select = screen.getByDisplayValue("WAV (Lossless)");
    await user.selectOptions(select, "mp3");
    await user.click(screen.getByText("Download"));

    expect(onDownload).toHaveBeenCalledWith("mp3");
  });

  it("disables download button when isDownloading", () => {
    render(
      <AudioPlayer
        audioUrl="blob:test-audio"
        onDownload={vi.fn()}
        isDownloading={true}
      />
    );
    expect(screen.getByText("Downloading...")).toBeInTheDocument();
    expect(screen.getByText("Downloading...")).toBeDisabled();
  });
});
