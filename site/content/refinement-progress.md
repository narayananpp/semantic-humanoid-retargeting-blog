### 3.2 Tracking error during refinement {#refinement-progress}

::: component aggregate-refinement-plot

A kinematic reference specifies the intended motion, but execution can produce large errors when contact fails or the robot cannot support the load. Figure 6 follows the performance of the iterative refinement process over a 30-minute budget. Each step reflects a new best execution as the agent revises the motion or controller. The dark curve averages across all tasks; the lighter curves show HUMOTO and OMOMO separately. The larger drops indicate substantial improvements, followed by smaller corrections as refinement progresses.

Mean ADD selects the best execution at each point; position and orientation report that same execution. The curves begin when all tasks have a scored execution; the unrefined kinematic replay was not recorded consistently enough to mark a shared starting value.
