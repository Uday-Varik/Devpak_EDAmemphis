import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

type AuthCallback = (event: string, session: unknown) => void;

const authState = vi.hoisted(() => ({
  callback: null as AuthCallback | null,
  session: null as unknown,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        authState.callback = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: authState.session } }),
      updateUser: async () => ({ error: null }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: () => {} }) }));

import ResetPassword from "@/pages/ResetPassword";

const renderPage = async () => {
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>
  );
  // Let the getSession promise resolve.
  await act(async () => {});
};

describe("ResetPassword recovery detection", () => {
  beforeEach(() => {
    authState.callback = null;
    authState.session = null;
  });

  it("does not show the form for an ordinary signed-in session", async () => {
    authState.session = { user: { id: "u1" } };
    await renderPage();
    expect(screen.queryByLabelText("New password")).toBeNull();
    expect(screen.getByText(/Open this page from the reset link/)).toBeTruthy();
  });

  it("shows the form when Supabase fires PASSWORD_RECOVERY", async () => {
    await renderPage();
    expect(screen.queryByLabelText("New password")).toBeNull();
    await act(async () => {
      authState.callback?.("PASSWORD_RECOVERY", { user: { id: "u1" } });
    });
    expect(screen.getByLabelText("New password")).toBeTruthy();
  });

  it("ignores ordinary sign-in events", async () => {
    await renderPage();
    await act(async () => {
      authState.callback?.("SIGNED_IN", { user: { id: "u1" } });
    });
    expect(screen.queryByLabelText("New password")).toBeNull();
  });
});
