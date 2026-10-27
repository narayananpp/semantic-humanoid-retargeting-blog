### 3.3 Agentic refinement walkthrough {#agentic-refinement-walkthrough}

Here we follow the agent selected by our orchestrator harness through a complete refinement of the clothes-stand interaction from **Figure 5**. In this OMOMO task, the robot must lift the stand, carry it through a turn and place it on the floor. Five saved revisions trace how the agent resolves a slipping grasp, brings the body into the motion and completes release.

<div class="refinement-walkthrough" id="clothesstand-walkthrough" data-refinement-walkthrough>
  <div class="walkthrough-origins">
    <figure><img class="walkthrough-public-still" src="assets/source-humans/sub10_clothesstand_002-4fbe6f93d1.jpg" alt="Human source motion"><video controls muted playsinline preload="none" poster="assets/source-humans/sub10_clothesstand_002-4fbe6f93d1.jpg" src="source-human-media/omomo/sub10_clothesstand_002.mp4?v=4fbe6f93d1" aria-label="Human source motion, SMPL-X"></video><figcaption>Human reference · <a href="https://smpl-x.is.tue.mpg.de/">SMPL-X</a></figcaption></figure>
    <figure><img class="walkthrough-public-still" src="assets/refinement/walkthrough/clothesstand-selected/final.jpg" alt="G1 places and releases the clothes stand"><video controls muted playsinline preload="none" poster="assets/refinement/walkthrough/clothesstand-selected/final.jpg" src="walkthrough-media/clothesstand-selected/final/video.mp4" aria-label="Orchestrator harness selected final dynamics reference"></video><figcaption>Orchestrator harness · final dynamics reference</figcaption></figure>
  </div>
  <div class="walkthrough-stage-tabs" role="group" aria-label="Refinement stages"></div>
  <div class="walkthrough-main">
    <div class="walkthrough-motion">
      <div class="walkthrough-stage-heading"><span data-walkthrough-step></span><h4 data-walkthrough-title></h4></div>
      <img class="walkthrough-public-still" data-walkthrough-still src="assets/refinement/walkthrough/clothesstand-selected/001.jpg" alt="Selected refinement stage">
      <video data-walkthrough-video controls muted playsinline preload="metadata" aria-label="Selected refinement stage execution"></video>
    </div>
    <aside class="walkthrough-curve-panel" aria-label="Refinement error curve">
      <div class="walkthrough-value"><span>Mean ADD ↓</span><strong data-walkthrough-value></strong></div>
      <svg data-walkthrough-curve viewBox="0 0 420 290" role="img" aria-label="Mean ADD across the selected agent’s recorded revisions"></svg>
      <div class="walkthrough-legend"><span><i class="accepted"></i>Best so far</span><span><i></i>Evaluated revision</span></div>
      <p data-walkthrough-time></p>
    </aside>
  </div>
  <div class="walkthrough-evidence" aria-live="polite">
    <blockquote class="walkthrough-message"><span>Agent’s log</span><p data-walkthrough-quote></p></blockquote>
    <div class="walkthrough-decision"><a data-walkthrough-tag></a><p data-walkthrough-description></p></div>
  </div>
  <div class="walkthrough-controls"><button type="button" data-walkthrough-prev>← Previous</button><button type="button" data-walkthrough-tour aria-pressed="false">Play walkthrough</button><button type="button" data-walkthrough-next>Next →</button></div>
  <p class="walkthrough-error" hidden></p>
</div>

**Fig. 7.** Five revisions of the OMOMO clothes-stand task by HuMoTAR’s selected agent. Videos show the simulated motions; agent excerpts describe the changes between trials. The highlighted curve point identifies the displayed revision and its mean ADD.
