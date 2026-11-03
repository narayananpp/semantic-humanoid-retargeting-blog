## 7. Discussion

### Iterative refinement and agentic swarms {#refinement-and-swarms}

**Iterative refinement with simulation feedback improves both object tracking and semantic success over one-shot generation.** The agents test their proposed motions, inspect the resulting executions and revise the motion and control code. These results support the use of agentic models for retargeting beyond generating an initial solution.

**Under a fixed time budget, the collaborative swarm outperforms a single Codex agent.** At matched compute, measured in agent-hours, longer single-agent refinement achieves higher semantic success at four times the elapsed time. These results suggest that swarms are useful when a solution is needed quickly, while a longer iterative loop remains valuable when more time is available. We encourage the community to study this compute–time tradeoff across more interactions and to investigate how communication and shared experience improve the use of a limited refinement budget.

### RL fine-tuning {#rl-fine-tuning}

Humanoid references can serve as training data for downstream whole-body policies. **Our results demonstrate the promise of agentic refinement using off-the-shelf models and low-level controllers**, without training a new policy for each interaction. Reinforcement-learning fine-tuning could build on these references to improve robustness to disturbances and variation in the task scene. Downstream policy training and deployment remain to be evaluated. We hope this work encourages the community to investigate agentic methods as a source of reference motions for learning interactive humanoid systems.

### Failure cases in dynamic retargeting {#failure-analysis}

Our approach still struggles with thin objects and difficult contact geometries. In the plate example, the robot lifts the plate but does not complete the human’s swirling motion. Across the recorded attempts, agents revise finger placement and try two-handed support, yet the grasp remains unreliable during rotation. **We observe that contact strategies must account for the robot’s hand morphology.** The Dex3 fingers must establish opposing contacts around a thin, sloped rim, which appears to contribute to the difficulty of this task. Motion and controller refinement do not yet resolve this limitation.

::: video discussion-plate
