## 2. A study of agentic retargeting

::: anchor configurations

We study three ways to use the same off-the-shelf model, [GPT-6 Astra](https://openai.com/index/gpt-6-astra/), for retargeting. Each receives the human-motion reference, the task scene and the robot interfaces. The distinction is how it proposes a solution and uses feedback.

**Astra one-shot** produces a motion and controller in one response. **[Codex](https://github.com/openai/codex)** works in a persistent coding session, executing and revising its solution. **HuMoTAR**, our harness, runs four independent Codex agents within a 30-minute refinement budget and retains the valid final execution with the lowest mean ADD. Two agents also receive optional retargeting tools for contact, geometry and tracking analysis. All four explore their own solutions without exchanging intermediate results.

Executions combine the generated manipulation controller with [SONIC](https://arxiv.org/abs/2511.07820) for whole-body tracking in [MuJoCo](https://mujoco.org/).

::: component refinement-loop

Agents can write their own analysis and control code. Two ensemble agents also receive optional retargeting helpers for contact, geometry and motion analysis. See [the tool interfaces in the appendix](#retargeting-tools) for details.
