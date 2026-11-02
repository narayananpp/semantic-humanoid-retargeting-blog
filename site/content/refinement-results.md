## 4. Retargeting results and analysis

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

### 4.1 Comparison with existing approaches {#comparison-results}

::: component dynamics-videos

::: component dynamics-results

### 4.2 Matched time: single-agent refinement versus swarms {#matched-time}

::: component results-matched-time

### 4.3 The effect of inter-agent communication {#inter-agent-communication}

::: component results-communication

### 4.4 Matched compute: longer iterative refinement {#matched-agent-hours}

::: component results-agent-hours

::: component results-within-run

### 4.5 The compute–time tradeoff {#compute-time-tradeoff}

::: component results-tradeoff
