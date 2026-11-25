import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { createSignedUrl, remove } = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: () => ({ createSignedUrl, remove }),
    },
  },
}));

import {
  createSignedFileUrl,
  deleteProjectFile,
  extractStoragePath,
  getStoredFileRef,
  resolveExportImages,
} from "../projectStorage";

const BUCKET = "project-photos";
const LEGACY_URL = `https://abc.supabase.co/storage/v1/object/public/${BUCKET}/proj-1/170_abc.jpg`;

describe("extractStoragePath", () => {
  it("returns a bare object path unchanged", () => {
    expect(extractStoragePath("proj-1/170_abc.jpg", BUCKET)).toBe("proj-1/170_abc.jpg");
  });

  it("extracts the path from a legacy public URL", () => {
    expect(extractStoragePath(LEGACY_URL, BUCKET)).toBe("proj-1/170_abc.jpg");
  });

  it("strips query strings and decodes encoded characters", () => {
    const url = `https://abc.supabase.co/storage/v1/object/public/${BUCKET}/proj-1/site%20plan.png?t=123`;
    expect(extractStoragePath(url, BUCKET)).toBe("proj-1/site plan.png");
  });

  it("returns null for a URL that points at a different bucket", () => {
    expect(extractStoragePath("https://example.com/other/file.jpg", BUCKET)).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractStoragePath("", BUCKET)).toBeNull();
    expect(extractStoragePath(null, BUCKET)).toBeNull();
    expect(extractStoragePath(undefined, BUCKET)).toBeNull();
  });
});

describe("getStoredFileRef", () => {
  it("prefers the stored path and falls back to a legacy url", () => {
    expect(getStoredFileRef({ path: "p/a.jpg", url: LEGACY_URL })).toBe("p/a.jpg");
    expect(getStoredFileRef({ url: LEGACY_URL })).toBe(LEGACY_URL);
    expect(getStoredFileRef({})).toBe("");
  });
});

describe("createSignedFileUrl", () => {
  beforeEach(() => {
    createSignedUrl.mockReset();
    remove.mockReset();
  });

  it("signs the extracted path for one hour", async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed/x" }, error: null });

    await expect(createSignedFileUrl(BUCKET, LEGACY_URL)).resolves.toBe("https://signed/x");
    expect(createSignedUrl).toHaveBeenCalledWith("proj-1/170_abc.jpg", 3600);
  });

  it("returns null when storage reports an error", async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: new Error("not found") });

    await expect(createSignedFileUrl(BUCKET, "proj-1/x.jpg")).resolves.toBeNull();
  });

  it("returns null when the request rejects", async () => {
    createSignedUrl.mockRejectedValue(new Error("network down"));

    await expect(createSignedFileUrl(BUCKET, "proj-1/x.jpg")).resolves.toBeNull();
  });

  it("does not call storage for an empty reference", async () => {
    await expect(createSignedFileUrl(BUCKET, "")).resolves.toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });
});

describe("deleteProjectFile", () => {
  beforeEach(() => {
    remove.mockReset();
  });

  it("removes the object behind a legacy URL", async () => {
    remove.mockResolvedValue({ data: [], error: null });

    await deleteProjectFile(BUCKET, LEGACY_URL);
    expect(remove).toHaveBeenCalledWith(["proj-1/170_abc.jpg"]);
  });
});

describe("resolveExportImages", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    createSignedUrl.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("embeds loadable images as data URLs and drops the ones that fail", async () => {
    createSignedUrl.mockImplementation(async (path: string) => ({
      data: { signedUrl: `https://signed/${path}` },
      error: null,
    }));
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("good.png")) {
        return { ok: true, blob: async () => new Blob(["img"], { type: "image/png" }) };
      }
      return { ok: false, status: 404, blob: async () => new Blob() };
    });

    const items: Array<{ path?: string; url?: string; caption: string }> = [
      { path: "proj-1/good.png", caption: "ok" },
      { path: "proj-1/missing.png", caption: "gone" },
    ];
    const result = await resolveExportImages(items, BUCKET);

    expect(result).toHaveLength(1);
    expect(result[0].caption).toBe("ok");
    expect(result[0].url).toMatch(/^data:image\/png;base64,/);
  });

  it("drops an item whose signing fails and keeps the export going", async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: new Error("denied") });

    const result = await resolveExportImages([{ path: "proj-1/a.png" }], BUCKET);

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes PDF attachments through without signing or downloading them", async () => {
    const pdf = { path: "proj-1/plan.pdf", fileType: "pdf", title: "Plan" };

    const result = await resolveExportImages([pdf], BUCKET);

    expect(result).toEqual([pdf]);
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
