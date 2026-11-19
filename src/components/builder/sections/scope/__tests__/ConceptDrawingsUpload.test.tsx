import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";

const upload = vi.fn();
const toastError = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload,
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://x/${path}` } }),
      }),
    },
  },
}));
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: vi.fn() },
}));

import { ConceptDrawingsUpload } from "../ConceptDrawingsUpload";

beforeEach(() => {
  upload.mockReset();
  toastError.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ConceptDrawingsUpload", () => {
  it("shows a toast and skips the file when the upload rejects", async () => {
    upload.mockRejectedValue(new Error("network down"));
    const onChange = vi.fn();
    const { container } = render(
      <ConceptDrawingsUpload drawings={[]} onChange={onChange} projectId="p1" />
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "plan.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    expect(toastError).toHaveBeenCalledWith("Failed to upload plan.png");
  });
});
