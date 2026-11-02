## 2. Comparing agentic workflows for humanoid retargeting

::: anchor configurations

**HuMoTAR uses agentic refinement with simulation feedback.** Each agent receives the human-motion reference, task scene and robot interfaces, then writes and tests motion and control code. We use the off-the-shelf [GPT-6 Astra](https://openai.com/index/gpt-6-astra/) model to compare four workflows.

- **Astra one-shot** produces a motion and controller in one response, without tool calls or further model revisions.
- **[Codex](https://github.com/openai/codex)** works in a persistent coding session, executing and revising its solution.
- **Independent agentic swarm** runs four Codex agents with a 30-minute refinement budget. Each develops its own solution without exchanging intermediate results.
- **Collaborative agentic swarm** uses the same four-agent setup, but agents can share findings, request help and critique each other’s strategies during refinement. Each agent decides when to communicate and tests changes in its own simulation.

Both swarms retain the valid final execution with the lowest mean object-tracking error (ADD).

Executions combine the generated manipulation controller with [SONIC](https://arxiv.org/abs/2511.07820) for whole-body tracking in [MuJoCo](https://mujoco.org/).

::: component refinement-loop
