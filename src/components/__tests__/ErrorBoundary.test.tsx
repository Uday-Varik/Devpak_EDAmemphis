import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

let shouldThrow = true;
const Flaky = () => {
  if (shouldThrow) throw new Error("boom");
  return <p>Recovered content</p>;
};

describe("ErrorBoundary", () => {
  it("offers Try again that re-renders the children once they no longer throw", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    shouldThrow = true;
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeTruthy();

    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Recovered content")).toBeTruthy();
  });
});
