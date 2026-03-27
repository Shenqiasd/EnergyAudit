# Platform Module Boundaries

## Platform core

`apps/web/src/modules/platform` owns frontend platform-level concerns that cut across enterprise, manager, and reviewer experiences:

- shell-level navigation boundaries
- session and access bootstrapping
- shared platform layout decisions
- cross-portal guards and common platform primitives

## Business modules

Business modules should own their own pages, workbenches, and workflow-specific components. They may consume shared platform primitives, but they should not push business behavior into the platform layer.

## Output and reporting

Report views, task result views, and output-focused screens belong to dedicated reporting or workflow modules. The platform layer should only provide the shared frame they render within.
