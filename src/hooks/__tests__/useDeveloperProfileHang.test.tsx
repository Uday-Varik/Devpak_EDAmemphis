import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1", email: "a@b.c" }, loading: false }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.reject(new Error("network down")),
        }),
      }),
    }),
  },
}));

import { useDeveloperProfile } from "../useDeveloperProfile";

describe("useDeveloperProfile", () => {
  it("stops loading when the profile query throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useDeveloperProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
