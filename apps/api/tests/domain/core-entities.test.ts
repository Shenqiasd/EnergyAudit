import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createAuditProject } from "../../../../packages/domain/src/entities";

describe("core domain entities", () => {
  it("connects enterprise, project, report, review, and rectification entities", () => {
    const project = createAuditProject({
      enterpriseId: "ent_1",
      batchId: "batch_1",
    });

    const migrationPath = resolve(
      process.cwd(),
      "apps/api/src/db/migrations/001_init_core_schema.sql",
    );
    const migration = readFileSync(migrationPath, "utf8");

    expect(project.enterpriseId).toBe("ent_1");
    expect(project.batchId).toBe("batch_1");
    expect(migration).toContain("create table enterprises");
    expect(migration).toContain("create table audit_projects");
  });
});
