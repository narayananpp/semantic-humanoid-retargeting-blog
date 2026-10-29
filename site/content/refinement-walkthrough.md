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

#### How does the reference change?

We overlay the **initial kinematic reference in purple** and the **refined reference in blue** with the **physical execution in solid gray**. Their spatial separation shows where the prescribed and executed robot poses differ at corresponding motion phases. The refined hand path follows the executed grasp more closely; body posture can still differ as the controller maintains balance.

<div class="reference-overlay-media">
  <figure>
    <a href="assets/refinement/reference-overlay/clothesstand-overlay.png" aria-label="Open the reference and execution overlay at full resolution"><img src="assets/refinement/reference-overlay/clothesstand-overlay.png" alt="Pickup, transport and placement: purple initial reference and blue refined reference overlaid on the solid gray simulated G1" loading="lazy" width="3414" height="2499"></a>
    <figcaption><strong>(a) Reference and execution.</strong> Both rows use the same physical rollout. Insets show hand alignment with the stand.</figcaption>
  </figure>
  <figure>
    <img class="reference-overlay-poster" src="assets/refinement/reference-overlay/contact-flow-poster.png" alt="Purple initial and blue refined finger-pad paths around the clothes stand" loading="lazy" width="1920" height="1080">
    <video controls muted playsinline preload="none" poster="assets/refinement/reference-overlay/contact-flow-poster.png" src="walkthrough-media/reference-overlay/contact-flow.mp4" aria-label="Initial and refined reference motions with left-hand finger-pad paths, at half speed"></video>
    <figcaption><strong>(b) Finger motion around the object.</strong> The video compares the two references at 0.5× speed along their shared target object path. Fading trails show recent finger-pad motion relative to the object, not measured contact forces.</figcaption>
  </figure>
</div>

**Fig. 7 (continued).** Initial and refined references for the clothes-stand interaction. The figure includes physical execution; the video shows reference geometry without online controller corrections.
