# Platform Domain Boundaries

## Platform core

`packages/domain/src/platform` owns framework-agnostic platform business language shared by the applications, such as:

- role names and platform state vocabulary
- identity and access-related value objects
- cross-application platform constants

## Business modules

Business modules should define their own domain objects and workflow concepts in their respective packages or modules. They may reference platform-level vocabulary, but they should not collapse their own business rules into the platform domain.

## Output and reporting

Output and reporting concerns should consume domain contracts from platform and business modules, but report-specific assembly rules stay in dedicated reporting code rather than the platform domain layer.
