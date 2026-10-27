## Appendix {#appendix-questions}

<details class="appendix-faq" id="kinematic-refinement">
<summary id="kinematic-question">How does HuMoTAR compare on kinematic retargeting?</summary>


We compare [GMR](https://arxiv.org/abs/2510.02252), [HOI-Retarget](https://arxiv.org/abs/2609.34674) and the Orchestrator-agent ensemble on the same task set.

We follow [HOI-Retarget’s evaluation protocol (Appendix A)](https://arxiv.org/html/2609.34674v1#A1): **body pose deviation**, **link velocity direction error**, **contact-point gap** and **relative hand-orientation change** measure how well the robot preserves the human motion and object-relative contacts. We also report **body jerk** as a smoothness measure, the mean magnitude of the third time derivative of the palm, ankle, head and pelvis positions, estimated by finite differences. Lower values indicate smoother motion.

::: component kinematic-videos

::: component kinematic-results

</details>
