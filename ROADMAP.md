# Development roadmap

Last reconciled with the live AIN Jira backlog: **2026-11-15**.

Build reusable insurance UI for submission preparation, placement, underwriting
and servicing. The first priorities are **participating parties** and **insured
subjects with locations, routes and boundaries**. Components accept typed data
and emit explicit user actions; the host application owns persistence, access,
identity verification and financial decisions.

This is proposed development work, not delivered functionality or a fixed release
schedule. Jira references identify application outcomes supported by the library;
finishing an XDS component does not complete its parent workflow. Estimates are
provisional library-only effort, including synthetic stories and component checks.
They exclude backend implementation, integrations and application release work.

## Reuse before adding

XDS already exports `RequestedCoverageEditor`, `CurrencyInput`, `DataTable`,
`DocumentRow`, `FileDropzone`, `ResultsPanel`, `ResultMetricCard`, `AllocationList`,
`NatCatRiskBanner`, `TreatyRenewalWatchlist` and other dashboard primitives.
Extend these where appropriate rather than create competing components.

The application already has `PartyParticipationCard`, `PartyAttributionForm`,
`SubjectInsuranceCard`, `SubjectInsuranceSection`, quote summaries and claims
screens. Network has `PartyParticipation`; Marketplace has
`MarketplaceParticipation`. Extract reusable presentation and controlled inputs
from those implementations; keep API requests, routing and domain orchestration
in their host packages. Existing screens are reuse candidates, not evidence that
all pending Jira acceptance criteria are implemented.

Completed AIN-56/62/70/73/74 provide registered-party and reviewed Network-link
context. Completed AIN-184/204 provide submission creation and example fixtures.
Do not reopen or count those as new work. AIN-59 remains In Progress; the party
onboarding stories below remain To Do at this review.

## First delivery: parties and insured subjects

| Priority | Component family                                                                        | Proposed scope                                                                                                                                                                           | Application traceability                                                                                                                                                            | Estimate    |
| -------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| P1       | `ParticipatingPartyCard`, `ParticipatingPartyEditor`, `ParticipatingPartyList`          | Reusable organization/person identity, submission roles, contacts, association state and independently supplied participation details. Extract the existing presentation where suitable. | [AIN-188](https://simeoncalixte1990.atlassian.net/browse/AIN-188), AIN-187/190; remaining financial identity context AIN-59                                                         | 18–26 hours |
| P1       | `InsuredSubjectCard`, `InsuredSubjectEditor`, `InsuredSubjectSchedule`                  | Stable subject identity, configurable risk attributes, linked parties, coverage references, exposure values and grouping by location. Extract existing host cards and sections.          | [AIN-87](https://simeoncalixte1990.atlassian.net/browse/AIN-87), AIN-96/108; user-requested reusable subject UI                                                                     | 16–24 hours |
| P1       | `InsuredSubjectGeometry`, `RiskLocationEditor`, `RiskRouteEditor`, `RiskBoundaryEditor` | A shared geometry contract with point, ordered route and polygon/multipolygon variants; accessible textual editing and optional map rendering.                                           | User-requested proposal supporting [AIN-101](https://simeoncalixte1990.atlassian.net/browse/AIN-101) and AIN-96. A dedicated geometry story and acceptance review are still needed. | 24–36 hours |
| P1       | `EvidenceReference`, `RevisionStatus`, `ReadinessIssueList`                             | Shared document anchors, source/as-of/version labels, unresolved conflicts, stale revisions and actionable readiness issues. Compose existing document/result primitives.                | [AIN-95](https://simeoncalixte1990.atlassian.net/browse/AIN-95), AIN-87/98; version context AIN-18/51                                                                               | 16–24 hours |

First delivery estimate: **74–110 hours**. A smaller first milestone is the party
and subject families alone: **34–50 hours**. Confirm these priorities and refine
estimates after interface design; do not count application tickets or their
subtasks again as additional library effort.

### Participating parties: acceptance criteria

- Support an organization/person discriminator, legal or full name, required
  contact email for submitted creation, country and configurable submission roles.
  Incomplete drafts remain distinguishable from submitted records. SPV and
  investor classifications extend the reviewed contract rather than force every
  individual into an organization.
- Keep party identity, submission association, contractual role and financial
  participation separate. One party can have several roles across subjects or
  contracts. Stable IDs survive editing, reordering and pagination.
- Display unclaimed, contact-verified, authority-pending, verified, disputed and
  revoked states from the host. A single generic “verified” badge must not imply
  KYC clearance, beneficial ownership, signing authority or a payment mandate.
- Show participation amount/share only when supplied with its basis, currency,
  source and effective revision. Preserve unavailable values; never infer a share
  from a party role, or treat a pending commitment as funded capital.
- Provide controlled add/edit/remove/select callbacks, read-only and redacted
  views, ambiguous-match review, validation and retry without losing draft rows.
  Invitations are explicit host actions; rendering or saving a draft sends none.
- Agree AIN-187's versioned contract before host adoption; coordinate required
  AIN-48/59 ownership slices and AIN-190 persistence without moving them into XDS.

Planned Storybook group: `Insurance/ParticipatingParty`, with `MixedParties`,
`MissingContact`, `AmbiguousMatch`, `MultipleRoles`, `Unclaimed`,
`ContactVerifiedAuthorityPending`, `Revoked`, `Redacted`, `RetryPreservesDraft`
and `PaginatedList`. These story names are targets, not existing test evidence.

### Insured subjects and geometry: acceptance criteria

- Separate **what is insured** from **where it is exposed**. Support a subject
  with no known location, several locations, a transit route or a geographic area;
  coverage and party relationships reference stable subject IDs.
- Start with typed, versioned point/route/boundary values compatible with GeoJSON.
  Specify longitude/latitude order, coordinate reference convention, precision,
  source and confirmed/approximate/unresolved states. An address is not a verified
  coordinate; missing coordinates must never become a point at 0,0.
- Point editing includes address and coordinates; route editing includes ordered
  origin/waypoints/destination and transport details; boundaries support polygons,
  holes and multipolygons. Preserve supplied geometry without silently inventing
  a route, geocoding an address or replacing an invalid shape.
- Define validation for coordinate ranges, minimum route points, closed rings,
  degenerate/self-intersecting shapes and antimeridian handling. Surface unsupported
  geometry with an actionable message. Agree the exact geometry-library strategy
  in the dedicated story before implementation.
- Supply keyboard-operable coordinate/waypoint editing and a textual summary so
  the map is optional. Host-injected map/geocoder adapters own provider calls and
  keys; synthetic Storybook examples need no paid mapping service.
- Compose an exposure schedule with configurable units, valuation dates, currency,
  source evidence and linked coverage. Do not treat TIV as the rating basis for
  every risk or sum incompatible currencies. Preserve unfamiliar risk attributes.
- Keep risk scoring, accumulation calculations and binding eligibility in owning
  services. Display supplied results and provenance without deriving decisions.

Planned Storybook group: `Insurance/InsuredSubject`, covering `PropertyLocation`,
`MultipleLocations`, `CargoRoute`, `AreaBoundary`, `BoundaryWithHole`,
`UnknownLocation`, `InvalidGeometry`, `Antimeridian`, `ReadOnly`, `NoMapProvider`
and `MixedExposureSchedule`, using invented subjects and coordinates.

## Next insurance component families

The following are proposed reusable UI slices of pending Jira outcomes. They do
not imply that the application currently lacks every corresponding screen.

| Order | Components                                                                            | Observable acceptance target                                                                                                                                                                                                                                                               | Pending Jira outcomes                                                                       |
| ----- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 1     | `CoverageTermsSummary`, `CoverageComparison`, extensions to `RequestedCoverageEditor` | Compare requested/quoted/bound terms by stable coverage and subject IDs; show limits, deductible basis, exclusions, conditions, period, currency and deviations; preserve missing or noncomparable terms.                                                                                  | [AIN-103](https://simeoncalixte1990.atlassian.net/browse/AIN-103), AIN-108/105              |
| 2     | `InsuranceLayerTower`, `CapacityBreakdown`                                            | Accessible diagram and equivalent table for attachment, limit, exhaustion, occurrence/aggregate basis and reinstatement terms; distinguish offered/reserved/committed/expired/released capacity and unknown balances. Render approved service results without a second calculation engine. | [AIN-111](https://simeoncalixte1990.atlassian.net/browse/AIN-111), AIN-88/24/25             |
| 3     | `LossExperienceTable`, `ExposureSummary`                                              | Paid/incurred and gross/ceded/retained views with periods, valuation dates, units and currencies; show supplied reconciliation discrepancies and evidence. Extend existing metrics/charts for source and unavailable states.                                                               | [AIN-96](https://simeoncalixte1990.atlassian.net/browse/AIN-96), AIN-101/22                 |
| 4     | `QuoteComparisonTable`, `MarketApproachTracker`                                       | Compare versioned offers and wording; show expiry, withdrawals, noncomparable fields, responsible broker and response deadlines. Distinguish evidenced delivery from manually recorded status.                                                                                             | [AIN-103](https://simeoncalixte1990.atlassian.net/browse/AIN-103), AIN-110/123/128          |
| 5     | `CounterpartyEvidencePanel`, `AuthorityStatus`, `ReferralDecisionPanel`               | Display evidence scope, source, expiry, unresolved checks, referral reason and permitted actions. Reuse party state presentation for claim/invitation/review UI; decisions and live authority checks remain server-owned.                                                                  | [AIN-92](https://simeoncalixte1990.atlassian.net/browse/AIN-92), AIN-99/192/194/196/198/200 |
| 6     | `PremiumBreakdown`, `ObligationStatus`                                                | Show premium, commission, tax and fees by payer/payee and currency; distinguish quoted/accrued/invoiced/due/partially paid/confirmed/reversed amounts and expose missing basis. Compose existing money and allocation controls.                                                            | [AIN-89](https://simeoncalixte1990.atlassian.net/browse/AIN-89), AIN-35/37/39               |
| 7     | `ClaimSummary`, `ClaimTimeline`, `RecoveryBreakdown`                                  | Notification and loss dates, subject/coverage versions, reserves, evidence and adjudication; distinguish recognized/disputed/paid/outstanding amounts and approved recovery versus confirmed receipt.                                                                                      | [AIN-114](https://simeoncalixte1990.atlassian.net/browse/AIN-114), AIN-118/124/135          |
| 8     | `BordereauxReviewTable`, `ReportingObligationList`                                    | Configurable columns and evidence, row/control totals, duplicates, period/currency errors, quarantined rows and reporting deadlines; host supplies validation and acceptance results.                                                                                                      | [AIN-104](https://simeoncalixte1990.atlassian.net/browse/AIN-104), AIN-125                  |
| 9     | `PolicyChangeSummary`, `RenewalComparison`                                            | Compare exact predecessor and proposed terms, effective dates, reasons and supplied adjustment previews; distinguish requested/effective/reconciled changes. Extend the existing renewal card/watchlist.                                                                                   | [AIN-112](https://simeoncalixte1990.atlassian.net/browse/AIN-112), AIN-115/126              |
| 10    | `DisclosurePackagePreview`, `DocumentVersionList`                                     | Recipient-specific section/document selection, redaction preview, exact versions, consent invalidation and revocation messaging. Build on `DocumentRow` and `FileDropzone`; the host enforces actual disclosure restrictions.                                                              | [AIN-102](https://simeoncalixte1990.atlassian.net/browse/AIN-102), AIN-113/122              |

Estimate these later families after interface discovery; no combined delivery date
or fabricated backlog estimate is assigned. Marketplace filtering and truthful
metrics (AIN-79/80) should consume the shared components where useful, while their
query, publication and investment workflows remain owned by Marketplace.

## Component delivery requirements

1. Define a typed public API, versioned values, stable entity references and
   controlled callbacks. Use configurable role, risk-class and field definitions;
   avoid a universal fixed insurance form. Validate untrusted host input at the
   owning boundary; UI rendering alone is not domain validation.
2. Add component exports, documentation, synthetic fixtures and executable
   Storybook `play` functions asserting user actions, visible results and exact
   callback payloads. Cover success, validation, empty/loading, failure/retry,
   read-only/permission/revocation and pagination where applicable.
3. Verify keyboard interaction, focus, 390px and desktop layouts, both themes,
   explicit labels, unavailable values and accessible alternatives to diagrams.
   Preserve matching before/after evidence when extracting existing application UI.
4. Register schema-renderable components in the XDS registry, regenerate prop
   manifests and verify contracts. Adding a registry entry does not implement the
   host workbench adapter; coordinate and test that separately before adoption.
5. Maintain Jira outcome → component → Storybook ID → verification mapping.
   Run package tests, lint, formatting, production Storybook build and actual
   browser interaction checks. The current Pages build does not itself execute
   all Storybook play functions; browser CI remains planned work below.
6. Keep examples runnable with invented data and isolated callbacks. No customer
   records, live invitations, application writes, backend credentials or model
   provider are needed for library development. Host integrations must separately
   verify authorization, persistence, concurrency and financial invariants.

## Cross-cutting quality work

Retained from the initial roadmap; these are library-wide improvements beyond the
component-specific acceptance checks above. Refine overlaps before scheduling.

| Work                             | Acceptance criteria                                                                                                           | Estimate   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Keyboard and focus accessibility | Audit Modal, Select, Navigation and filter panels; fix observed issues; add keyboard regression stories.                      | 8–12 hours |
| Interaction coverage             | Add assertions for form validation, disabled controls, dialog dismissal and filter reset; run browser interactions in CI.     | 6–10 hours |
| Responsive and theme coverage    | Exercise representative components at mobile and desktop widths in light/dark themes; fix overflow and contrast issues found. | 6–8 hours  |
| Consumer documentation           | Document theme setup, router requirements and common composition examples; verify examples against the packed library.        | 4–6 hours  |
| Package compatibility            | Extend packed-consumer checks for documented subpaths, CSS and supported peer versions.                                       | 4–6 hours  |

Quality-work estimate: **28–42 hours**, subject to overlap refinement. Do not add
it mechanically to the first-delivery estimate.

## Scope and status of this plan

Only this roadmap is updated by this planning pass. No proposed component is
implemented, and no Jira issue is created, transitioned or declared complete.
References were read from the live backlog on the date above; future implementers
must refresh statuses, children, required dependencies and acceptance criteria.
Jira links may require access; the component scope is described here for public
readers without that access.

Required application dependencies include party contracts and persistence,
version/evidence ownership and the domain services behind the displayed results.
Their work is separate from this library roadmap. AI/model configuration,
provider infrastructure, payment execution, database migrations and unrelated
platform operations are excluded from XDS implementation scope. Public UI
components and synthetic demos do not by themselves establish Labelbox eligibility;
the actual project ownership, use and program review still govern acceptance.
