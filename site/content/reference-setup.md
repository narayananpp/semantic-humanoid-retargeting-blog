## 1. Rethinking humanoid retargeting

::: anchor hoi-reference
::: anchor kinematic-setup

::: video intro-human-demonstrations

::: anchor execution-task

We propose **HuMoTAR, an agentic approach to semantic humanoid retargeting**. The agents write, test and iteratively revise motion and control code through **closed-loop simulation feedback**. We posit that frontier agentic models provide useful priors for preserving a motion’s semantic intent while meeting the robot’s physical requirements.

The pairs above show human demonstrations of carrying a chair and moving a clothes stand alongside their retargeted humanoid motions. For a humanoid to perform these tasks, each demonstration must first be adapted to its body, since a *humanoid differs from a human in proportions, joint limits and actuation*. Current human-to-humanoid retargeting methods largely formulate this as a **kinematic problem**, in which the human’s motion is fitted to the robot while relevant contacts with the environment are preserved. [**HOI-Retarget**](https://arxiv.org/abs/2609.34674), for example, optimizes the robot’s motion to match the demonstration’s body poses and object-relative contacts. This raises the question of *what a humanoid should preserve from a demonstration*.

We argue that **retargeting should preserve the intended task rather than the precise movements a human uses to perform it**. Take, for example, a person who carries and places a chair with one hand. The goal is to carry the chair to a target location and place it there, not to exactly reproduce the one-handed grasp motion. A humanoid may use both hands if that better suits its morphology and physical limits, since the task is unchanged even though the grasp and posture differ from the demonstration. In our experiments, we scale the demonstrated object trajectory to the robot’s size and use it as the target motion. The robot’s contact strategy, posture and controller are free to change.

::: anchor execution-setup
::: anchor dynamic-interaction

**A kinematically feasible reference is not necessarily dynamically feasible.** [**SPIDER**](https://arxiv.org/abs/2511.09484) addresses this by posing retargeting as a constrained optimization over the robot’s motor commands. It samples many candidate command sequences in a physics simulator and keeps the ones whose simulated motion stays closest to the reference. However, errors in the input motion reference can lead SPIDER to the wrong contact strategy. Its open-loop execution is also sensitive to the robot’s starting pose. **HuMoTAR revises both the motion reference and control code based on the resulting physical execution.**

### Carry and place a chair

::: video intro-chair-comparison

### Lift, carry and place a clothes stand

::: video intro-stand-comparison

The above examples illustrate the gap between kinematic retargeting and physical execution. We execute the kinematic references provided by HOI-Retarget using SPIDER in physics simulation and compare them with HuMoTAR’s references. SPIDER fails to complete either task, while HuMoTAR achieves successful execution in physics simulation in both cases.
