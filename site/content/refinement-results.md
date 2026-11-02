## 5. Quantitative results

::: anchor agent-comparison

::: anchor study-design

### 5.1 Comparison with existing approaches {#comparison-results}

We first evaluate our agentic retargeting approach, **HuMoTAR, against HOI-Retarget + SPIDER** on **20 HUMOTO and 20 OMOMO tasks**. For this comparison, we consider the [single-Codex configuration](#configuration-plain) and include **Astra one-shot** to examine performance without iterative refinement.

::: component dynamics-results

::: component dynamics-videos

**HOI-Retarget + SPIDER and Astra one-shot achieve semantic success rates of 5% and 2.5%, respectively. With iterative simulation feedback, a single Codex agent achieves 47.5%.** Mean object-tracking error also decreases from **52.48 cm for HOI-Retarget + SPIDER** and **62.98 cm for Astra one-shot** to **23.74 cm for Codex**. These results highlight the importance of **iterative refinement with simulation feedback** for successful physical execution.

### 5.2 Matched time: single-agent refinement versus swarms {#matched-time}

::: component results-matched-time

### 5.3 The effect of inter-agent communication {#inter-agent-communication}

::: component results-communication

### 5.4 Matched compute: longer iterative refinement {#matched-agent-hours}

::: component results-agent-hours

::: component results-within-run

### 5.5 The compute–time tradeoff {#compute-time-tradeoff}

::: component results-tradeoff
