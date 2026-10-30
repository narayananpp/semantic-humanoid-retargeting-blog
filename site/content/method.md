## 2. What is the best way to do agentic retargeting?

::: anchor configurations

**HuMoTAR combines independent agentic refinement with simulation feedback.** Each agent receives the human-motion reference, task scene and robot interfaces, then writes and tests motion and control code. We use the off-the-shelf [GPT-6 Astra](https://openai.com/index/gpt-6-astra/) model and compare HuMoTAR with two simpler configurations to examine the contributions of iterative feedback and multiple agents.

- **Astra one-shot** produces a motion and controller in one response.
- **[Codex](https://github.com/openai/codex)** works in a persistent coding session, executing and revising its solution.
- **HuMoTAR**, our harness, runs four independent Codex agents within a 30-minute refinement budget and retains the valid final execution with the lowest mean ADD. Two agents also receive optional retargeting tools for contact, geometry and tracking analysis. All four explore their own solutions without exchanging intermediate results.

Executions combine the generated manipulation controller with [SONIC](https://arxiv.org/abs/2511.07820) for whole-body tracking in [MuJoCo](https://mujoco.org/).

::: component refinement-loop

Agents can write their own analysis and control code. Two ensemble agents also receive optional retargeting helpers for contact, geometry and motion analysis. See [the tool interfaces in the appendix](#retargeting-tools) for details.
