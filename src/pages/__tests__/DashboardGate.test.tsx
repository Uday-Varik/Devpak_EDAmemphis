import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const state = vi.hoisted(() => ({
  profileResult: { data: null as unknown, error: null as unknown },
  navigate: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  Object.assign(chain, {
    select: self,
    eq: self,
    order: self,
    maybeSingle: () => Promise.resolve(state.profileResult),
    then: (resolve: (v: unknown) => unknown) => resolve({ data: [], error: null }),
  });
  return { supabase: { from: () => chain } };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1", email: "a@b.c" }, loading: false, signOut: vi.fn() }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => state.navigate };
});

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock("@/components/TeachingModeToggle", () => ({ TeachingModeToggle: () => null }));
vi.mock("@/utils/geocodeAddress", () => ({ geocodeToSiteFields: vi.fn() }));

import Dashboard from "@/pages/Dashboard";

const renderDashboard = async () => {
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
  await act(async () => {});
};

describe("Dashboard developer-profile gate", () => {
  beforeEach(() => {
    state.navigate.mockReset();
    state.toast.mockReset();
    state.profileResult = { data: null, error: null };
  });

  it("does not send the user to onboarding when the profile check fails", async () => {
    state.profileResult = { data: null, error: { message: "network down" } };
    await renderDashboard();
    expect(state.navigate).not.toHaveBeenCalledWith("/onboarding");
    expect(state.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }));
  });

  it("sends the user to onboarding when there really is no profile", async () => {
    state.profileResult = { data: null, error: null };
    await renderDashboard();
    expect(state.navigate).toHaveBeenCalledWith("/onboarding");
  });
});
