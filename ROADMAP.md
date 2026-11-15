# Development roadmap

Proposed next work for EnsuredXDS. Estimates are planning ranges, not completed
work or a commitment to a release date. The maintainer should confirm priorities
before using these estimates in a project application.

| Work                             | Acceptance criteria                                                                                                           | Estimate   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Keyboard and focus accessibility | Audit Modal, Select, Navigation and filter panels; fix observed issues; add keyboard regression stories.                      | 8–12 hours |
| Interaction coverage             | Add assertions for form validation, disabled controls, dialog dismissal and filter reset; run browser interactions in CI.     | 6–10 hours |
| Responsive and theme coverage    | Exercise representative components at mobile and desktop widths in light/dark themes; fix overflow and contrast issues found. | 6–8 hours  |
| Consumer documentation           | Document theme setup, router requirements and common composition examples; verify examples against the packed library.        | 4–6 hours  |
| Package compatibility            | Extend packed-consumer checks for documented subpaths, CSS and supported peer versions.                                       | 4–6 hours  |

Total proposed work: **28–42 hours**. Use synthetic examples only. Keep the
component library and its demo runnable without a backend, customer documents,
model provider, or private application checkout.
