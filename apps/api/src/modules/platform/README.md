# Platform Module Boundaries

## Platform core

`apps/api/src/modules/platform` owns backend platform-level concerns that are shared across business flows:

- authentication boundary integration
- internal role and permission orchestration
- platform-wide policies and guards
- cross-module platform bootstrap behavior

## Business modules

Business workflow modules such as enterprise, audit project, review, and rectification should depend on platform contracts, but they should keep their own state transitions and domain services outside this module.

## Output and reporting

Report generation, chart output, export jobs, and other result-producing capabilities belong to dedicated reporting or output modules. The platform module should only provide shared access-control or lifecycle hooks they rely on.
