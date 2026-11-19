import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

type Listener = (event: string, session: unknown) => void;
let listener: Listener | null = null;
let resolveSession: ((v: unknown) => void) | null = null;
let rejectSession: ((e: unknown) => void) | null = null;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: Listener) => {
        listener = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: () =>
        new Promise((res, rej) => {
          resolveSession = res;
          rejectSession = rej;
        }),
    },
  },
}));

import { AuthProvider, useAuth } from "../useAuth";

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const fakeSession = { user: { id: "u1", email: "a@b.c" } };

beforeEach(() => {
  listener = null;
  resolveSession = null;
  rejectSession = null;
});

describe("AuthProvider initialization", () => {
  it("keeps a session delivered by the listener when a stale getSession resolves null", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => listener!("SIGNED_IN", fakeSession));
    await waitFor(() => expect(result.current.user?.id).toBe("u1"));

    await act(async () => resolveSession!({ data: { session: null } }));

    expect(result.current.user?.id).toBe("u1");
    expect(result.current.loading).toBe(false);
  });

  it("stops loading when getSession rejects", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => rejectSession!(new Error("network")));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
