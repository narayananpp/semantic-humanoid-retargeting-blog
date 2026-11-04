This repository hosts the Semantic Humanoid Retargeting research blog, exploring how iterative refinement transforms human motion references into humanoid–object interactions. It includes experimental results, interactive visualizations, and videos illustrating motion refinement and the role of prior experience.

Edit the main blog directly in `site/index.html`, including its table of contents.
This file is the source of truth and is published unchanged. The older Markdown
and templates for the main article are retained for reference; they do not
overwrite it during builds. Interactive figures and videos use the JavaScript,
JSON and media files alongside it. The separate experience page still uses its
Markdown sources.

To preview the site, run `python -m http.server 8000 --directory site` and open
`http://localhost:8000`. Before pushing, build into an empty directory with
`python build.py --output /tmp/humotar-preview`, then run
`python validate.py /tmp/humotar-preview`. GitHub Pages builds and deploys pushes
to `main`.

The interactive architecture (`site/architecture.js`) uses a recorded single-Codex
clothes-stand run. Its public data lives in `site/architecture-trace/trace.json`.
Initial, iterations 001, 002, 003, 006, 013, 017, and the final execution
from iteration 023 retain verified scores. Source metadata cites original events and distinguishes
before-execution checks from after-execution feedback. The initial evaluation
uses arrays verified identical to the agent input; it was not run by this agent.
The Agent image tab retains the original image-inspection calls. The Blender tab
shows labelled re-renders of saved starting poses or rollout frames. The ADD history contains
all 25 recorded candidates. Hand details are explicitly labelled crops of
inspected images. Reconstructed plots are not presented as plots the agent
itself viewed. The exporter in
`tools/export_architecture_trace.py` checks those scores and retains source hashes.
The final video reuses the existing single-Codex baseline recording. Only rendered
media and measurements are published, with no new model or scene assets.

The architecture uses a compact reference → IK → joint-space-reference diagram.
The recorded implementation combines edits to the existing joint-space reference,
wrist-pose IK and specified finger targets. Reference-preview videos use forward
kinematics of the saved reference arrays, without SONIC or physics execution.
Colored arms show reference poses; gold markers show nominal wrist targets from
the saved grasp plans, before online controller corrections. The object-path plot
uses all three recorded coordinates and supports mouse, touch and keyboard rotation.
The exporter accepts `--reference-views` and `--blender-stills` to attach the
rendered previews and preserve their provenance.
