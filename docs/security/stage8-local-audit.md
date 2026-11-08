# Stage 8 local security regression

Historical review. Updated results and remediation are in
[stage8-local-closure.md](stage8-local-closure.md).

Date: 2026-11-06. Branch: `feature/security-hardening`. Run `npm run security:final`
for an explicit regression of stages 0–6. Stage 7 email login OTP/Magic Link and
human ROOT recovery/global activation are excluded. The general `npm test`
business/hardware suite remains available and unchanged.

The runner keeps per-suite logs and a JSON manifest under
`test-results/security-final`; override the directory with
`COMERZIA_SECURITY_EVIDENCE_DIR`. A failed task makes the final exit nonzero;
initial failures must remain recorded when rerunning selected suites.

Final local results: 46 unit tests; mocked browser API suites: sessions 13,
email 21, SaaS 64, public identity 28, preflight 10, recovery UI 6. The two
static-image browser checks also pass after providing the existing anonymous
API fixture: the isolated Nginx container does not include a backend. These
checks establish CSP/static asset behavior, not connected authentication.

The SaaS payment test now requires the real UI MFA step before mutation and
asserts the bound grant/body. The two-tab test adds credential-free timing
diagnostics, retaining its original assertions and timeout. Initial timing
failures were followed by 3/3 targeted passes and a 13/13 final sessions run;
that is recorded instability, not a demonstrated product fix.

Runtime image requires libexpat >=2.10.0-r0 to invalidate the stale vulnerable
Alpine package layer. The rebuilt image passes its OS package scan. TypeScript,
build and strict security lint pass. General lint still has 310 pre-existing
errors without increase; npm tooling has seven moderate advisories and an
unsupported ESLint version. Runtime npm audit has zero known advisories.

The full administrative report, technical findings and evidence are outside
this Git checkout under `../informes/etapa-8/`. Production is **NO-GO** pending
the documented backend/infrastructure issues. No credentials, business/payment
catalogs, POS modal code or production provider settings were changed.
