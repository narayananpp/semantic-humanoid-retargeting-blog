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
Trials 001, 002, 006 and 023 retain their original scores and agent excerpts.
Images come from the original image-inspection calls. Feedback curves are
reconstructed from replays verified against the recorded mean ADD; they are not
claimed to be plots the agent itself viewed. The exporter in
`tools/export_architecture_trace.py` checks those scores and retains source hashes.
The final video reuses the existing single-Codex baseline recording. Only rendered
media and measurements are published, with no new model or scene assets.
