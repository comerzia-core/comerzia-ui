# English code and routes

- All new or modified technical identifiers must be English: variables, fields, classes, functions, components, files, enums, constants, API codes, logs and URL paths.
- Canonical paths must use English lowercase kebab-case. Do not create route enums. Update route declarations, links, configuration contracts and tests together.
- Spanish is reserved for useful explanatory code comments. Localized product copy and business data are presentation/content, never technical identifiers or inputs to business decisions; preserve their intended language unless a task explicitly changes localization.
- Compare stable technical codes, never Spanish labels or error prose, for business logic. Consume the authoritative catalog instead of inventing values.
- Legacy Spanish paths may exist only as documented compatibility aliases with tests. They must resolve to English canonical paths without dropping query/fragment material, extending token lifetime or bypassing guards. New links must use English paths.
- Do not perform unrelated refactors or change excluded components. Preserve historical evidence and private environment configuration.
