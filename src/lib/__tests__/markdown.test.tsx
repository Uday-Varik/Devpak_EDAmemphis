import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderMarkdown } from "../markdown";

const view = (src: string) => render(<div>{renderMarkdown(src)}</div>);

describe("renderMarkdown", () => {
  it("renders headings, paragraphs and bold text", () => {
    view("# Title\n\n## Section\n\nSome **bold** text.");
    expect(screen.getByRole("heading", { level: 1, name: "Title" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeTruthy();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  it("renders bullet lists and tables", () => {
    view("- one\n- two\n\n| Name | Value |\n|---|---|\n| a | 1 |");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("cell", { name: "1" })).toBeTruthy();
  });

  it("does not inject raw HTML", () => {
    const { container } = view("<script>alert(1)</script> plain");
    expect(container.querySelector("script")).toBeNull();
  });
});
