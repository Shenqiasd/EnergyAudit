import { describe, expect, it } from "vitest";

describe("platform core skeleton", () => {
  it("exposes role constants for three-end model", async () => {
    let platformRoles: readonly string[] = [];

    try {
      ({ PLATFORM_ROLES: platformRoles } = await import(
        "../../../../packages/shared/src/constants/roles"
      ));
    } catch {
      // The red phase should fail because the role constants do not exist yet.
    }

    expect(platformRoles).toContain("enterprise_user");
    expect(platformRoles).toContain("manager");
    expect(platformRoles).toContain("reviewer");
  });
});
