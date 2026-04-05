import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Navigation from "../Navigation";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("Navigation", () => {
  it("renders Slides and Text to Speech links", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Navigation />);
    expect(screen.getByText("Slides")).toBeInTheDocument();
    expect(screen.getByText("Text to Speech")).toBeInTheDocument();
  });

  it("has correct href values", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Navigation />);
    expect(screen.getByText("Slides")).toHaveAttribute("href", "/");
    expect(screen.getByText("Text to Speech")).toHaveAttribute("href", "/tts");
  });

  it("highlights Slides link when on home page", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Navigation />);
    expect(screen.getByText("Slides")).toHaveClass("text-gray-900");
  });

  it("highlights TTS link when on TTS page", () => {
    mockUsePathname.mockReturnValue("/tts");
    render(<Navigation />);
    expect(screen.getByText("Text to Speech")).toHaveClass("text-gray-900");
  });
});
