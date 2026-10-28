## 6. Discussion

### Limits of the metrics {#metric-limitations}

We use object-tracking error to measure how closely an execution follows the desired object motion. **Low tracking error does not always imply task success.** A robot may remain close to the target trajectory while losing contact or leaving the interaction incomplete. An alternative motion may also accomplish the task without closely following the demonstration. User studies could help evaluate whether the intended outcome is preserved. LLM judges offer another way to provide semantic feedback during refinement and evaluation, provided their judgments are checked against human assessments. We encourage further work on these complementary measures of retargeting quality.

### RL fine-tuning {#rl-fine-tuning}

Retargeted references can serve as training data for whole-body policies intended for deployment. Our results show that off-the-shelf models, combined with a pretrained whole-body controller, can refine a range of interactions in simulation. **Reinforcement-learning fine-tuning is a natural next step** toward policies that can reproduce these interactions under disturbances and changes in object properties. We have not yet evaluated downstream policy training or transfer to hardware. We hope this study encourages the community to investigate agentic refinement as a way to produce useful references for that training.

### Failure cases in dynamic retargeting {#failure-analysis}

**Thin objects remain difficult to manipulate reliably.** In the plate task below, HuMoTAR achieves a partial lift but does not complete the demonstrated swirling motion. The agents repeatedly revise finger placement around the sloped rim, yet contacts that support a lift fail during rotation. This points to a mismatch between the required grasp and the geometry and articulation of the Dex3 hand. Hand morphology is a likely contributor: refining the motion alone may not resolve an interaction that requires a different arrangement of supporting contacts.

::: video discussion-plate
