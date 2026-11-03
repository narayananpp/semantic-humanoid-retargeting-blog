## 7. Discussion

### Iterative refinement and agentic swarms {#refinement-and-swarms}

**Iterative refinement with simulation feedback improves both object tracking and semantic success over one-shot generation.** The agents test their proposed motions, inspect the resulting executions and revise the motion and control code. These results support the use of agentic models for retargeting beyond generating an initial solution. **Under a fixed time budget, the collaborative swarm outperforms a single Codex agent.** At matched compute, measured in agent-hours, longer single-agent refinement achieves higher semantic success at four times the elapsed time. These results suggest that swarms are useful when a solution is needed quickly, while a longer iterative loop remains valuable when more time is available. We encourage the community to study this compute–time tradeoff across more interactions and to investigate how communication and shared experience improve the use of a limited refinement budget.

### RL fine-tuning {#rl-fine-tuning}

The reference motions produced by HuMoTAR could be used to train whole-body policies for deployment. Our experiments use SONIC without task-specific policy training. A next step is to evaluate whether **RL fine-tuning on these references** helps the robot handle disturbances and changes in the scene. Policy training and hardware deployment remain future work.

### Failure cases in dynamic retargeting {#failure-analysis}

In the example shown below, G1 must lift and swirl a plate to reproduce the human’s interaction. It lifts the plate but does not complete the swirling motion. The agents adjust finger placement and try supporting the plate with both hands, but the grasp remains unstable during rotation. **The plate’s thin rim is difficult to grasp with Dex3 fingers.** The tested motion and controller revisions do not overcome this difficulty.

::: video discussion-plate
