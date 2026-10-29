## Appendix {#appendix-questions}

<details class="appendix-faq" id="kinematic-refinement">
<summary id="kinematic-question">How does HuMoTAR compare on kinematic retargeting?</summary>


We compare [GMR](https://arxiv.org/abs/2510.02252), [HOI-Retarget](https://arxiv.org/abs/2609.34674) and the Orchestrator-agent ensemble on the same task set.

We follow [HOI-Retarget’s evaluation protocol (Appendix A)](https://arxiv.org/html/2609.34674v1#A1): **body pose deviation**, **link velocity direction error**, **contact-point gap** and **relative hand-orientation change** measure how well the robot preserves the human motion and object-relative contacts. We also report **body jerk** as a smoothness measure, the mean magnitude of the third time derivative of the palm, ankle, head and pelvis positions, estimated by finite differences. Lower values indicate smoother motion.

::: component kinematic-videos

::: component kinematic-results

</details>


<details class="appendix-faq" id="text-to-trajectory">
<summary id="text-to-trajectory-question">Can a text description replace a motion reference?</summary>

We give a single Codex agent a detailed task description, the scene and an initial robot–object state, without a human motion reference or target object trajectory. The agent has **30 minutes** to refine an execution that follows the description, using **SONIC for the legs and waist** and custom arm and hand control. These five examples show the supplied commands and the resulting simulated motions.

<div class="text-motion-showcase" data-text-motion-showcase>
  <label class="text-motion-picker">Task <select data-text-motion-select aria-label="Choose a text-to-trajectory task">
<option value="lifting_and_checking_basket_90-215">Lift and inspect a basket</option>
<option value="lifting_side_table_and_putting_down-362">Lift, lower and lift a side table</option>
<option value="carry_side_table_with_both_hands_walk_around-536">Walk and turn while carrying a side table</option>
<option value="sub10_clothesstand_002">Lift, move and set down a clothes stand</option>
<option value="sub15_woodchair_053">Rock a wooden chair and return it upright</option>
  </select></label>
  <div class="text-motion-example" data-text-motion-example="lifting_and_checking_basket_90-215">
    <div class="text-motion-command"><h4>Lift and inspect a basket</h4><p class="text-motion-label">Text command</p><blockquote>A basket rests on the floor in front of the person. Bend toward it and reach down with the right hand to take its handle. Lift the basket clear of the floor while straightening the body. Bring it in front of the torso, then use the other hand to help steady and turn it for inspection. Tilt and rotate the basket so its opening and different sides can be examined, rather than simply holding it motionless. Keep it under control throughout the lift and the changes in orientation. Finish standing with the basket held in front of the body; the demonstrated sequence ends while it is still being held.</blockquote></div>
    <figure><img class="text-motion-still" src="text-motion-media/lifting_and_checking_basket_90-215.jpg" alt="Simulated output for Lift and inspect a basket" loading="lazy" width="960" height="540"><video controls muted playsinline preload="none" poster="text-motion-media/lifting_and_checking_basket_90-215.jpg" src="text-motion-media/lifting_and_checking_basket_90-215.mp4" aria-label="Text-to-trajectory output: Lift and inspect a basket"></video><figcaption>Simulated execution · normal speed</figcaption></figure>
  </div>
  <div class="text-motion-example" data-text-motion-example="lifting_side_table_and_putting_down-362" hidden>
    <div class="text-motion-command"><h4>Lift, lower and lift a side table</h4><p class="text-motion-label">Text command</p><blockquote>A small wooden side table with a raised curved rail stands on the floor in front of the person. Bend down, grasp the raised rail and lift the table off the floor as the body straightens. Keep the tabletop approximately level and the legs directed downward. Lower it back onto its legs in front of the body, then pause with the table supported on the floor. Bend toward it again and repeat the lifting action. Make the separate pickup, lowering, supported pause and renewed pickup recognizable, rather than replacing them with a single static hold or dragging the table along the floor. Remain near the table and keep each movement controlled.</blockquote></div>
    <figure><img class="text-motion-still" src="text-motion-media/lifting_side_table_and_putting_down-362.jpg" alt="Simulated output for Lift, lower and lift a side table" loading="lazy" width="960" height="540"><video controls muted playsinline preload="none" poster="text-motion-media/lifting_side_table_and_putting_down-362.jpg" src="text-motion-media/lifting_side_table_and_putting_down-362.mp4" aria-label="Text-to-trajectory output: Lift, lower and lift a side table"></video><figcaption>Simulated execution · normal speed</figcaption></figure>
  </div>
  <div class="text-motion-example" data-text-motion-example="carry_side_table_with_both_hands_walk_around-536" hidden>
    <div class="text-motion-command"><h4>Walk and turn while carrying a side table</h4><p class="text-motion-label">Text command</p><blockquote>Hold the small wooden side table with both hands in front of the torso, keeping its legs clear of the floor. Walk while carrying it along a curved path that turns the body through several facing directions, then comes back toward the starting area. The table travels with the person and turns with the body; its legs remain generally downward and the tabletop remains approximately level, with natural tilting during the turns. Keep both hands supporting the table while stepping and changing direction. Finish the walking sequence still holding the table in front of the body. The interaction should show sustained transport and turning, not stationary lifting or sliding on the floor.</blockquote></div>
    <figure><img class="text-motion-still" src="text-motion-media/carry_side_table_with_both_hands_walk_around-536.jpg" alt="Simulated output for Walk and turn while carrying a side table" loading="lazy" width="960" height="540"><video controls muted playsinline preload="none" poster="text-motion-media/carry_side_table_with_both_hands_walk_around-536.jpg" src="text-motion-media/carry_side_table_with_both_hands_walk_around-536.mp4" aria-label="Text-to-trajectory output: Walk and turn while carrying a side table"></video><figcaption>Simulated execution · normal speed</figcaption></figure>
  </div>
  <div class="text-motion-example" data-text-motion-example="sub10_clothesstand_002" hidden>
    <div class="text-motion-command"><h4>Lift, move and set down a clothes stand</h4><p class="text-motion-label">Text command</p><blockquote>Stand beside a tall freestanding clothes stand with a circular base and branches near the top. Reach to its vertical pole around waist height with one hand. Lift its base clear of the floor, then take a few steps to move the stand to a nearby position while keeping the pole mostly upright. Move the body together with the stand rather than reaching from a fixed stance. Lower the circular base onto the floor, allow the stand to settle upright, and release the pole. Finish beside the independently standing object with the hand withdrawn. The lift, short transport and deliberate placement should be clearly visible.</blockquote></div>
    <figure><img class="text-motion-still" src="text-motion-media/sub10_clothesstand_002.jpg" alt="Simulated output for Lift, move and set down a clothes stand" loading="lazy" width="960" height="540"><video controls muted playsinline preload="none" poster="text-motion-media/sub10_clothesstand_002.jpg" src="text-motion-media/sub10_clothesstand_002.mp4" aria-label="Text-to-trajectory output: Lift, move and set down a clothes stand"></video><figcaption>Simulated execution · normal speed</figcaption></figure>
  </div>
  <div class="text-motion-example" data-text-motion-example="sub15_woodchair_053" hidden>
    <div class="text-motion-command"><h4>Rock a wooden chair and return it upright</h4><p class="text-motion-label">Text command</p><blockquote>Face a wooden chair and bend toward it, placing both hands around the sides of the seat or nearby frame. Tilt and rock the chair so its seat and back lean and one pair of legs rises while the other pair remains near the floor. Guide the chair back toward an upright orientation and bring all four legs down under control. Keep the hands engaged while the chair changes orientation, and adjust the body with the movement. Finish with the chair upright and supported on its legs. This is a controlled rocking and righting interaction, not carrying the chair away or allowing it to fall.</blockquote></div>
    <figure><img class="text-motion-still" src="text-motion-media/sub15_woodchair_053.jpg" alt="Simulated output for Rock a wooden chair and return it upright" loading="lazy" width="960" height="540"><video controls muted playsinline preload="none" poster="text-motion-media/sub15_woodchair_053.jpg" src="text-motion-media/sub15_woodchair_053.mp4" aria-label="Text-to-trajectory output: Rock a wooden chair and return it upright"></video><figcaption>Simulated execution · normal speed</figcaption></figure>
  </div>
</div>

</details>
