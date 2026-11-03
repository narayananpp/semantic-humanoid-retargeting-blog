## 5. Quantitative results

::: anchor agent-comparison

::: anchor study-design

### 5.1 Comparison with existing approaches {#comparison-results}

::: component dynamics-videos

We first evaluate our agentic retargeting approach, **HuMoTAR, against HOI-Retarget + SPIDER** on **20 HUMOTO and 20 OMOMO tasks**. For this comparison, we consider the [single-Codex configuration](#configuration-plain) and include **Astra one-shot** to examine performance without iterative refinement.

::: component dynamics-results

**HOI-Retarget + SPIDER and Astra one-shot achieve semantic success rates of 5% and 2.5%, respectively. With iterative simulation feedback, a single Codex agent achieves 47.5%.** Mean object-tracking error also decreases from **52.48 cm for HOI-Retarget + SPIDER** and **62.98 cm for Astra one-shot** to **23.74 cm for Codex**. These results highlight the importance of **iterative refinement with simulation feedback** for successful physical execution.

### 5.2 Matched time: single-agent refinement versus swarms {#matched-time}

We compare a single Codex agent with the [independent](#configuration-ensemble) and [collaborative](#configuration-collaborative) agentic swarms under the same **30-minute time budget**. Each swarm runs four agents, so it uses four times the allocated agent-hours.

::: component results-matched-time

**Agentic swarms improve retargeting within the same time budget, with the strongest task-completion results from inter-agent communication.** Running four independent agents can help reduce **“seed luck”** and improve **reliability**, since one agent may find a solution that another misses. Here, the independent swarm improves object tracking and achieves semantic success on 21 tasks, compared with 19 for a single agent.

::: anchor inter-agent-communication

**Inter-agent communication raises semantic success from 52.5% to 67.5% with the same four-agent budget.** The agents divide experiments, test and improve each other’s controllers, and share unsuccessful results so other agents know what has already been tried. They also use feedback from other agents to correct mistakes in their evaluation. In a monitor task where the robot must lift and move a monitor, one agent identifies an object drop near the end of a rollout that another had judged successful. The second agent acknowledges the missed failure and identifies controlled placement as the next step.

Independent agents, on the other hand, sometimes spend part of their budget on overlapping approaches, without access to each other’s findings. In a tripod task where the robot must lift, move and place a tripod, two independent agents separately test unsuccessful two-handed grasps using closely overlapping strategies.

### 5.3 Matched compute: longer iterative refinement {#matched-agent-hours}

We compare two HuMoTAR settings: **a collaborative swarm of four Codex agents running for 30 minutes each** and **a single Codex agent running for 120 minutes**. Both receive the same allocated compute budget of *two agent-hours*. This comparison assesses whether a longer iterative loop improves on a shorter collaborative swarm.

::: component results-agent-hours

The two settings achieve similar object-tracking accuracy, but **longer single-agent refinement achieves higher overall semantic success: 75% versus 67.5%**. The longer iterative loop completes three additional tasks, at four times the elapsed time.
