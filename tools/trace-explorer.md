# Collaborative trace explorer

Serve `site/` over HTTP and open `trace-explorer.html`. The explorer is static:
no inference, API, server-side simulation or account login is required.

The clothes-stand recording includes all four collaborative agents. Agent 0
provided the selected final execution. Six featured stages show the initial
reference, four saved trials and the selected final execution.
Playback and activity focus on Agent 0; the Exchanges tab keeps the messages
across all four agents. The six featured stages follow Agent 0: initial, 001, 004, 055, 090 and final.
Trial 055 improves object tracking; trial 090 shows a later regression. These
are selected trials, not consecutive iterations. All recorded trial scores are retained in the data; the history chart shows only prepared replays.

## Preparing the display data

Run `export_collaborative_trace.py --help` for required source paths. The script
uses NumPy and Pillow, plus packing helpers in `trace_assets.py`.
Original source archives remain unchanged and are not copied to the website.

- Intermediate replays use the saved controllers, references and initial states.
  Their mean object-tracking errors must match the recorded scores within 0.01 cm.
- Final motions are the original saved validation rollouts. The initial reference
  is a separate measured execution with SONIC, before agent refinement.
- Activity displays visible messages and descriptions of recorded operations.
  Shell commands and generated source code are omitted. Named communication
  calls retain their tool names. These labels are descriptions, not agent quotes.
- Exchanges preserve the original messages, with private paths and account
  identifiers removed. Source event lines and archive hashes are retained.
- Inspected images are resized to at most 1280 pixels and encoded as WebP.
- Motions use shared geometry and packed transforms. Images load lazily, and MP4
  clips load on demand. No new physics steps run in the browser.
- Contact markers show object-involving contacts above 0.01 N in prepared
  intermediate replays, including floor contacts. Object paths are the scorer's
  spatially resampled curves, not time-aligned instantaneous error vectors.
- Unprepared trials still show their measured results and recorded activity.

A deep link selects an agent, trial and tab, for example:
`trace-explorer.html#agent=0&trial=final&tab=exchanges`.

## Validation

Check all six stages, Agent 0’s final motion, playback, scrub, camera presets,
path/contact overlays, activity search, image previews, exchanges, result plots,
automatic stage playback, deep links and mobile overflow. Check rendered MP4s
against their corresponding motion bundles. Check public data for private paths
and account details before publishing.

Three.js is pinned locally at 0.170.0 with its MIT notice. The G1 asset notice is
retained. No SONIC weights or SMPL models are included.

## Publication notices

The upstream OMOMO/InterMimic object-asset notice explicitly permits redistribution
under MIT. The clothes-stand source has 17,996 vertices and matches the compiled
playback geometry within 9.35e-8 metres without fitting or scaling. The source
links, hashes and verification result are retained in `vendor/mesh-provenance.json`.
Keep all notices in `vendor/`, including source motion attribution and terms.

No mesh-download link is offered. Video download controls are hidden where the
browser supports it. These are presentation choices, not access protection:
anything sent to a browser can be saved or extracted.

## Architecture recording

The main article links to `trace-explorer-architecture.html`. Its eight featured
stages use the same source events, motion hashes, videos and ADD values as
`architecture-trace/trace.json`. The two-hour recording remains separate in
`trace-explorer-2h.html`.

`export_architecture_explorer.py` takes explicit paths to the original recording,
recovered images, verified replay bundles and initial/final bundles. It checks
event and motion hashes against the architecture before publishing. All 25
candidate scores are retained, alongside the separately evaluated initial
reference; iteration 023 is labelled as the final selected execution. No agent
or physics simulation is run during export or browser playback.

The architecture input videos use `architecture-trace/input-timing.json`, exported
by `export_architecture_input_timing.py`. The mapping matches identical object
poses in the original and revised references. Only the human and initial-reference
videos receive these timing adjustments; generated-reference and simulator
rollout videos remain at 1×. The initial and final holds come from the saved
reference timestamps, rather than a uniform duration ratio.
