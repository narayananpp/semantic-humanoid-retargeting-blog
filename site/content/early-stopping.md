### 4.4 How much refinement can a shorter budget retain? {#early-stopping}

::: component early-stopping-plot

**Early stopping limits the time spent on iterative refinement while retaining the best reference motion output obtained so far.** Here, the stopping condition is elapsed refinement time: at a chosen cutoff, we retain the reference motion output and its controller from the refinement stage with the lowest measured mean ADD for each task. We evaluate this condition retrospectively using the recorded executions and token usage from the full 30-minute runs.

Figure 9 marks the average time each task takes to reach **90%, 95% and 99% of its recorded ADD reduction**. The **95% milestone averages 22.3 minutes**, which motivates a 22.3-minute early-stopping cutoff. Stopping every task at that time retains **88.4% of the improvement on average**, because individual tasks reach their milestones at different times.
