import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireStaff: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { requireStaff } from "../../lib/auth";
import { deleteProperty } from "../../app/actions/crm";
const id = "00000000-0000-4000-8000-000000000010";
const prefix = `https://project.supabase.co/storage/v1/object/public/property-images/properties/${id}/`;
const remove = vi.fn();
const destroy = vi.fn();
const read = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  read.mockResolvedValue({
    data: { images: [prefix + "photo.png", "https://other.example/photo.png"] },
    error: null,
  });
  const result = {
    eq: () => ({
      select: () => ({ single: async () => ({ data: { id }, error: null }) }),
    }),
  };
  destroy.mockReturnValue(result);
  vi.mocked(requireStaff).mockResolvedValue({
    db: {
      from: () => ({
        select: () => ({ eq: () => ({ single: read }) }),
        delete: destroy,
      }),
      storage: {
        from: () => ({
          getPublicUrl: () => ({ data: { publicUrl: prefix } }),
          remove,
        }),
      },
    },
  } as unknown as Awaited<ReturnType<typeof requireStaff>>);
});
function form() {
  const f = new FormData();
  f.set("id", id);
  f.set("confirm", "on");
  return f;
}
describe("property deletion across database and Storage", () => {
  it("retains the property when photo removal fails", async () => {
    remove.mockResolvedValue({ error: new Error("Storage offline") });
    expect(await deleteProperty({}, form())).toMatchObject({
      error: expect.stringContaining("retained"),
    });
    expect(destroy).not.toHaveBeenCalled();
  });
  it("removes only this property's bucket paths before deleting the row", async () => {
    remove.mockResolvedValue({ error: null });
    expect(await deleteProperty({}, form())).toMatchObject({
      success: "Property deleted.",
    });
    expect(remove).toHaveBeenCalledWith([`properties/${id}/photo.png`]);
    expect(remove.mock.invocationCallOrder[0]).toBeLessThan(
      destroy.mock.invocationCallOrder[0],
    );
  });
  it("does not delete anything when the property read fails", async () => {
    read.mockResolvedValue({ data: null, error: new Error("Unavailable") });
    expect(await deleteProperty({}, form())).toMatchObject({
      error: "Property not found.",
    });
    expect(remove).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });
});
