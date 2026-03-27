import { describe, expect, it } from "vitest";

import { PLATFORM_ROLES } from "../../../../packages/shared/src/constants/roles";

describe("platform core skeleton", () => {
  it("exposes role constants for three-end model", () => {
    expect(PLATFORM_ROLES).toContain("enterprise_user");
    expect(PLATFORM_ROLES).toContain("manager");
    expect(PLATFORM_ROLES).toContain("reviewer");
  });
});
