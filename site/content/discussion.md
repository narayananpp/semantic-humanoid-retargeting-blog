## 6. Discussion

### Limits of the metrics {#metric-limitations}

**We posit that retargeting should be evaluated by the successful transfer of an interaction’s semantic intent.** In this study, we use object tracking as a measurable objective, but it does not fully capture whether the robot accomplishes the task. The plate example below illustrates this gap: a partial lift can yield a low tracking error without completing the intended motion. User studies could provide a more direct assessment of interaction success. LLM-based judges could also supply semantic feedback during refinement and evaluation. We encourage the community to explore these directions and assess their agreement with human judgments.

### RL fine-tuning {#rl-fine-tuning}

Humanoid references can serve as training data for downstream whole-body policies. **Our results demonstrate the promise of agentic refinement using off-the-shelf models and low-level controllers**, without training a new policy for each interaction. Reinforcement-learning fine-tuning could build on these references to improve robustness to disturbances and variation in the task scene. Downstream policy training and deployment remain to be evaluated. We hope this work encourages the community to investigate agentic methods as a source of reference motions for learning interactive humanoid systems.

### Failure cases in dynamic retargeting {#failure-analysis}

Our approach still struggles with thin objects and difficult contact geometries. In the plate example, the robot lifts the plate but does not complete the human’s swirling motion. Across the recorded attempts, agents revise finger placement and try two-handed support, yet the grasp remains unreliable during rotation. **We observe that contact strategies must account for the robot’s hand morphology.** The Dex3 fingers must establish opposing contacts around a thin, sloped rim, which appears to contribute to the difficulty of this task. Motion and controller refinement do not yet resolve this limitation.

::: video discussion-plate
