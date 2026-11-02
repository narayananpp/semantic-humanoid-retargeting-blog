## 3. Retargeting results and analysis

::: anchor agent-comparison

::: anchor study-design

### Evaluation metrics {#dynamics-metrics}

Results cover **20 HUMOTO and 20 OMOMO tasks**. We report **object-tracking errors** and **semantic success** for each comparison.

**Object tracking.** We compare the object’s pose in the simulated execution with the human-reference object trajectory scaled for G1. The target trajectory stays fixed, and the object’s size is unchanged. We align the two paths by progress through translation and rotation rather than elapsed time, so the robot can move at a different speed or pause.

- **Mean ADD (cm):** at each aligned pair of object poses, we measure the distances between corresponding points on the object. The average over points and the trajectory captures both position and orientation error.
- **Position error (cm):** the average distance between the simulated and target object origins.
- **Orientation error (°):** the average angle between the simulated and target object orientations.

All three errors are averaged equally across tasks. **Lower is better.**

**Semantic success.** Astra compares the human demonstration with the robot execution and judges whether the intended object interaction is completed. Exact timing, posture and grasp need not match. We report the percentage of tasks judged PASS, after a separate review for obvious initial hand–object penetration. Incomplete executions count as unsuccessful. **Higher is better.** The [evaluation protocol](#semantic-evaluation) includes the judge prompt and review criteria.

### 3.1 Comparison with existing approaches {#comparison-results}

::: component dynamics-videos

::: component dynamics-results

**Iterative Codex completes 19 of 40 tasks, compared with 2 for SPIDER and 1 for Astra one-shot.** It also lowers ADD on 35 tasks relative to SPIDER and 39 relative to one-shot. The improvement therefore appears in both object tracking and the judged interaction. These comparisons establish the benefit of the tested iterative workflow, before adding multiple agents. [Per-task comparisons](#results-baseline-evidence).

### 3.2 Matched time: single-agent refinement versus swarms {#matched-time}

::: component results-matched-time

**At 30 minutes, the collaborative swarm completes 27 tasks, compared with 19 for both Codex and the independent swarm.** The independent swarm reduces mean ADD from 23.74 to 16.96 cm, but seven newly successful tasks are offset by seven regressions. Lower tracking error does not necessarily mean that more tasks are completed.

The independent workers produce different executions with different errors. Selecting among them improves tracking relative to a typical worker, but this does not establish that they explore distinct strategies or avoid repeated work. [Worker-level results](#results-exploration-evidence).

<a class="results-view-link" href="#dynamics-showcase" data-showcase-method="communicating">View task executions</a>

### 3.3 The effect of inter-agent communication {#inter-agent-communication}

::: component results-communication

**The collaborative swarm succeeds on ten tasks that the independent swarm fails, and regresses on two.** Its mean ADD is lower on 24 of 40 tasks. The logs contain direct messages, shared controller files and independent tests of peer proposals, including proposals that are rejected after testing.

This establishes that communication affects the refinement process, rather than merely accompanying it. It does not isolate how much of the result comes from reuse, critique or different sampled strategies. We report the exchanges and both directions of outcome change in the [communication analysis](#results-communication-evidence).

<a class="results-view-link" href="#dynamics-showcase" data-showcase-method="orchestrator">View independent and collaborative executions</a>

### 3.4 Matched compute: longer iterative refinement {#matched-agent-hours}

::: component results-agent-hours

We match the allocated compute budget in agent-hours: four agents for 30 minutes and one Codex agent for 120 minutes each receive two agent-hours.

**Two-hour Codex completes 30 tasks, compared with 27 for the 30-minute collaborative swarm.** Six tasks pass only with Codex and three pass only with the swarm. These are separate runs, so their final outcomes alone cannot show whether additional refinement time caused the difference.

To test continued refinement directly, we also follow the same two-hour runs over time. Among the 35 runs with an eligible saved execution by 30 minutes, 33 achieve a lower ADD later. Their paired mean falls from **30.17 to 10.65 cm**. The selected reference changes in 31 runs and the initial robot state changes in 26. This is evidence of further motion refinement within a run, not just a comparison between different sampled solutions.

::: component results-within-run

For semantic success, we use the existing final judgments from the separate 30-minute and 120-minute Codex runs: **19/40 versus 30/40 tasks**. We do not infer intermediate PASS or FAIL outcomes from the within-run tracking curves. [Timing, selection and per-task evidence](#results-longer-evidence).

<a class="results-view-link" href="#dynamics-showcase" data-showcase-method="codex120">View longer-refinement executions</a>

### 3.5 The compute–time tradeoff {#compute-time-tradeoff}

::: component results-tradeoff

The collaborative swarm reaches **67.5% semantic success in 30 minutes**. Two-hour Codex reaches **75% in 120 minutes**. Both are allocated two agent-hours: four agents for half an hour, or one agent for two hours. The observed tradeoff is a shorter completion budget versus a higher final success rate. Agent-hours describe the allocation, not identical token consumption or simulation work. [Budget definitions and comparison limits](#results-budget-evidence).
