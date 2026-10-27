## 4. Dynamic retargeting results

::: anchor agent-comparison


::: anchor study-design

### Experimental setup

We compare HOI-Retarget + SPIDER, Astra one-shot, Codex and the Orchestrator-agent ensemble on 20 HUMOTO tasks and 20 OMOMO tasks. Each dataset uses the same task list across all four methods. We report the saved final execution from each run and average equally across tasks.

Codex refines the motion with one agent. The ensemble runs four independent agents, two with optional access to the provided retargeting tools, and selects the final reference by mean ADD. Refinement is evaluated over a 30-minute budget. HOI-Retarget + SPIDER uses the frozen humanoid-object optimization configuration with G1 and Dex3. SPIDER runs at its native 60 Hz integration rate; the agent-generated controllers use the harness’s 500 Hz simulation. Both are scored against the same object targets.

### Object tracking metrics {#dynamics-metrics}

We compare the object’s pose in the **dynamic humanoid–object interaction rollout** with the **human-reference object trajectory scaled for G1**. The reference trajectory stays fixed during refinement, and the object’s size is unchanged. We compare poses along the two object paths in the order they occur, allowing the robot to move at a different speed or pause. Both paths are sampled by progress through translation and rotation, rather than elapsed time.

- **Mean ADD (cm):** at each aligned pair of poses, we place the same set of object points at the simulated pose and at the reference pose, then measure the distance between each pair of corresponding points. Averaging these distances over the points and the trajectory gives mean ADD, capturing both position and orientation error in one distance.
- **Position error (cm):** average Euclidean distance between the simulated and reference object origins.
- **Orientation error (°):** average angle of the relative rotation between the simulated and reference object orientations.

All three metrics use the same trajectory alignment. We compute each task’s score first, then average equally across tasks; lower is better.

### Results {#comparison-results}

::: component dynamics-videos

::: component dynamics-results

