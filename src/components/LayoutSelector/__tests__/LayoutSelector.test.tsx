import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LayoutSelector from "../LayoutSelector";

describe("LayoutSelector", () => {
  it("renders three preset buttons", () => {
    render(<LayoutSelector ratio={0.65} onChange={vi.fn()} />);
    expect(screen.getByText("60:40")).toBeInTheDocument();
    expect(screen.getByText("65:35")).toBeInTheDocument();
    expect(screen.getByText("70:30")).toBeInTheDocument();
  });

  it("highlights the active ratio", () => {
    render(<LayoutSelector ratio={0.65} onChange={vi.fn()} />);
    expect(screen.getByText("65:35")).toHaveClass("bg-blue-600");
    expect(screen.getByText("60:40")).not.toHaveClass("bg-blue-600");
  });

  it("calls onChange with correct value on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LayoutSelector ratio={0.65} onChange={onChange} />);

    await user.click(screen.getByText("70:30"));
    expect(onChange).toHaveBeenCalledWith(0.7);
  });
});
