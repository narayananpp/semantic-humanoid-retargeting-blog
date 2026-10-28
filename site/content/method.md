## 2. A study of agentic retargeting

::: anchor configurations

We study three ways to use the same off-the-shelf model, [GPT-6 Astra](https://openai.com/index/gpt-6-astra/), for retargeting. Each receives the human-motion reference, the task scene and the robot interfaces. The distinction is how it proposes a solution and uses feedback.

**Astra one-shot** produces a motion and controller in one response. **[Codex](https://github.com/openai/codex)** works in a persistent coding session, executing and revising its solution. **The Orchestrator-agent ensemble**, our harness, runs four independent Codex agents within a 30-minute refinement budget and retains the valid final execution with the lowest mean ADD. Two agents also receive optional retargeting tools for contact, geometry and tracking analysis. All four explore their own solutions without exchanging intermediate results.

Executions combine the generated manipulation controller with [SONIC](https://arxiv.org/abs/2511.07820) for whole-body tracking in [MuJoCo](https://mujoco.org/).

::: component refinement-loop

::: anchor retargeting-tools

Agents can write their own analysis and control code. Two ensemble agents also receive a supplied retargeting-tools file, which they may use, modify or replace. These helpers expose the following measurements and interfaces; they do not prescribe a grasp or a refinement sequence.

**Table 1.** Interfaces available during refinement.

| Tool or interface | What it provides |
| --- | --- |
| Contact inspection | Contact locations, normals and forces from a saved execution, with close-up views. |
| Geometry checks | Contact gaps, surface alignment, penetration and joint-limit margins for a proposed pose. |
| Motion diagnostics | Link-position and orientation errors, and reference, command and execution joint traces. |
| Object-path evaluation | Mean ADD, position and orientation errors against the fixed target trajectory. |
| Whole-body control | A frozen tracking policy driven by a motion reference. |
| Custom joint control | Targets, gains and feedforward torques for the agent’s manipulation controller. |
