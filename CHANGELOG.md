# Changelog

## 0.1.1 - 2026-06-05

### Polished

- Refined the Lovelace card visual system for cleaner Home Assistant light and dark theme rendering.
- Softened panel borders, gauge surfaces, metric chips, and alert rows so compact and dashboard layouts feel less boxed-in.
- Tightened compact glance spacing and gauge sizing for a more balanced mobile-friendly card footprint.

## 0.1.0 - 2026-06-01

Initial clean-room release candidate for the Australian BOM Space Weather Home Assistant integration and bundled Lovelace card.

### Added

- Home Assistant config flow with backend-only BOM SWS API key storage, reauthentication, polling interval options, stale-data threshold options, and unique K-index location handling.
- Documented BOM SWS API coverage for A index, K index, Dst index, magnetic alert, magnetic warning, aurora alert, aurora watch, and aurora outlook.
- Sensor, binary sensor, button, and select platforms for current index values, active notices, derived aurora/storm/freshness states, manual refresh, and K-index station selection.
- Automation-friendly summary entities for condition, severity level, active alert count, aurora visibility, aurora K-Aus, aurora latitude band, magnetic storm scale, endpoint status, API error count, data age, and data health.
- Redacted Home Assistant diagnostics, sanitized API error metadata, and an authenticated backend history endpoint for the Lovelace card.
- Compact graphical Lovelace card with K-index severity, active alert count, active notice chips, aurora visibility, magnetic storm scale, data age, Dst, A index, and station by default.
- YAML and visual-editor controls for presets, display modes, density, true light/dark/sunrise theme handling, compact metric/chip slots, entity targeting, labels, colours, thresholds, gauge options, actions, grid sizing, and diagnostics.
- HACS-compatible repository layout with bundled card resource registration.

### Polished

- Reduced the default glance card footprint, flattened the card styling, and removed decorative gradients while keeping gauge rings as functional data visualization.
- Simplified README screenshots to compact and dashboard light/dark examples only.
- Pinned GitHub Actions workflow dependencies to immutable SHAs after security review.

### Known Limitation

- Live active aurora and magnetic notice payloads are event-dependent. Documented notice shapes are handled, but final real-event validation should happen during a live BOM notice window.
