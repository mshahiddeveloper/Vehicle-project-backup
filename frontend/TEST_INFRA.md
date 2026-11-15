# E2E Test Infra: SafarPK Mobility Marketplace

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: Tests derive directly from `ORIGINAL_REQUEST.md` (R1-R5), Handover Specification (§0-§13), and `PROJECT.md`.
- **Zero Network / In-Browser Determinism**: Tests run within a deterministic Node/Vitest environment with in-memory Web Storage (`localStorage`) and browser event mocks (`CustomEvent`, `window.dispatchEvent`).
- **Methodology**: 4-Tier test engineering leveraging Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Interaction (§12a Matrix), and Real-World End-to-End Workloads across all 5 mobility services.

---

## Feature Inventory & Test Coverage
| # | Feature Area | Requirement Source | Tier 1 (Happy Path) | Tier 2 (Boundary & Corner) | Tier 3 (Cross-Feature §12a) |
|---|--------------|-------------------|:-------------------:|:--------------------------:|:---------------------------:|
| 1 | Unified Booking Store & Lifecycle | R1, Spec §12a, §13 | 6 tests | 6 tests | ✓ |
| 2 | 24-Hour Lead Deduplication & Proof | R3, Spec §10 | 6 tests | 6 tests | ✓ |
| 3 | Stealth Audit Log & State Diffs | R4, Spec §0 Rule 8, §11, §12 | 6 tests | 6 tests | ✓ |
| 4 | Promo Codes & EXTRA_TIME | R1, R4, Spec §4, §8.5 | 6 tests | 6 tests | ✓ |
| 5 | Plan Days Left & Month-Math Extensions | R1, R4, Spec §4, §12 | 6 tests | 6 tests | ✓ |
| 6 | Document Validation, OCR & CNIC Format | R2, Spec §0 Rule 7, §7, §8.4 | 6 tests | 6 tests | ✓ |
| 7 | Driver Masking & Unmasking Lifecycle | R2, Spec §7.4 | 6 tests | 6 tests | ✓ |
| 8 | Vehicle Publishing Double-Gate & Quota | R2, Spec §8.3, §8.5 | 6 tests | 6 tests | ✓ |
| 9 | Staff Agent 9 Permission Switches | R4, Spec §4, §11 | 6 tests | 6 tests | ✓ |
| **Total** | | | **54 tests** | **54 tests** | **5 scenarios** |

---

## Test Architecture
- **Runner**: Vitest 4.1.2 with custom Node test setup (`frontend/tests/setup.ts`).
- **Invocation**: `npm.cmd run test:e2e` (or `npx.cmd vitest run`).
- **Execution Speed**: Sub-second execution (<1000ms for full suite).
- **Semantics**: Exit code `0` on 100% test pass; non-zero on any failure.
- **Path Resolution**: Native TypeScript `@/*` alias mapping to `frontend/src/*`.
- **Directory Layout**:
  ```
  frontend/
  ├── vitest.config.ts                      # Vitest configuration with @/* alias & setupFiles
  ├── package.json                          # Scripts: "test:e2e": "vitest run"
  └── tests/
      ├── setup.ts                          # In-memory LocalStorage, window, eventTarget mocks
      ├── helpers/
      │   ├── eventSpy.ts                   # Event listener spy utility for CustomEvents
      │   └── mockData.ts                   # Test fixtures (users, listings, bookings)
      ├── tier1-feature-coverage.test.ts    # 54 Tier 1 feature coverage tests
      ├── tier2-boundary-corner.test.ts     # 54 Tier 2 boundary, corner & negative tests
      ├── tier3-cross-feature.test.ts       # Tier 3 §12a cross-portal dynamic sync scenarios
      └── tier4-application-scenarios.test.ts # Tier 4 real-world 5-service end-to-end journeys
  ```

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Self-Drive Car Rental Customer Journey | Homepage Tab 0, Licence OCR simulation, CNIC 13-digit format, deposit & fare quote, WhatsApp booking dispatch, customer booking | High |
| 2 | Independent Chauffeur Hiring Journey | Homepage Tab 1, driver directory, credential masking, outstation duty, lister confirmation, unmasking in customer portal | High |
| 3 | City-to-City Intercity Ride Journey | Homepage Tab 2, one-way vs return trip fare recalculation, toll/fuel inclusions, ride booking dispatch | Medium |
| 4 | Pick & Drop Commuter Shuttle Journey | Homepage Tab 3, school/office route selection, live seat vacancy badge, waitlist behavior on full van (0 seats) | Medium |
| 5 | Home Shifting Movers Cargo Journey | Homepage Tab 4, truck tonnage rating, km + helpers cost estimator (-10%/+15%), "Send to 3 Movers" broadcast | High |
| 6 | Super Admin & Staff Agent Governance Journey | Agent 9 permission switches hiding unpermitted UI, plan extension month math (active vs expired), promo code creation & geo-fencing | High |

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥5 tests per feature area (Total: 54 tests, achieving ≥5 per feature).
- **Tier 2 (Boundary & Corner Cases)**: ≥5 tests per feature area (Total: 54 tests, achieving ≥5 per feature).
- **Tier 3 (Cross-Feature Combinations)**: 5 comprehensive pairwise scenarios covering the complete §12a matrix.
- **Tier 4 (Real-World Application Scenarios)**: 6 end-to-end multi-role customer, lister, and admin journeys.
- **Grand Total**: >115 test cases verifying 100% of SafarPK core marketplace requirements.
