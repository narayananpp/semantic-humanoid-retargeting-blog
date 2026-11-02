## 1. Rethinking humanoid retargeting

::: anchor hoi-reference
::: anchor kinematic-setup

::: video intro-human-demonstrations

Consider the human demonstrations above, in which a person carries a chair, moves a clothes stand and tilts a bin with one foot. For a humanoid to perform these tasks, each demonstration must first be adapted to its body, since a *humanoid differs from a human in proportions, joint limits and actuation*. Current human-to-humanoid retargeting methods largely formulate it as a **kinematic problem**, in which the human’s motion is fitted to the robot while relevant contacts with the environment are preserved. [**HOI-Retarget**](https://arxiv.org/abs/2609.34674), for example, optimizes the robot’s motion to match the demonstration’s body poses and object-relative contacts. This raises the question of *what a humanoid should preserve from a demonstration*.

We argue that **retargeting should preserve the intended task rather than the precise movements a human uses to perform it**. Take, for example, a person who carries and places a chair with one hand. The goal is to carry the chair to a target location and place it there, not to exactly reproduce the one-handed grasp motion. A humanoid may use both hands if its morphology and physical limits allow it, since the task is unchanged even though the grasp and posture differ from the demonstration. In our experiments, the demonstrated object trajectory, scaled to the size of the robot, specifies the desired object motion, while the robot’s contact strategy, posture and controller are free to change.

::: anchor execution-setup
::: anchor dynamic-interaction

**A kinematically feasible reference is not necessarily dynamically feasible.** [**SPIDER**](https://arxiv.org/abs/2511.09484) addresses this by posing retargeting as a constrained optimization over the robot’s motor commands. It samples many candidate command sequences in a physics simulator and keeps the ones whose simulated motion stays closest to the reference. In our HOI-Retarget + SPIDER comparison, **the reference stays fixed**: SPIDER optimizes the controls used to execute the motion supplied by HOI-Retarget.

::: anchor execution-task

We posit that **frontier agentic models provide useful priors for making these changes**. We explore the usage of LLM agents to write, test and iteratively revise motion and control code through **closed-loop simulation feedback**.

### Carry and place a chair

::: video intro-chair-comparison

### Lift, carry and place a clothes stand

::: video intro-stand-comparison
