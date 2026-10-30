## 1. Does humanoid retargeting survive physics?

::: anchor hoi-reference
::: anchor kinematic-setup

**A retargeted motion can look convincing and still fail when executed.** Motion retargeting translates a human demonstration into robot motion, accounting for differences in body proportions, joints and contact geometry. A kinematic replay shows the prescribed poses; it does not establish that the robot can balance, support the object or keep it from slipping.

[HOI-Retarget](https://arxiv.org/abs/2609.34674) optimizes humanoid motion to preserve the demonstration's body motion and object-relative contacts. We execute its references using [SPIDER](https://arxiv.org/abs/2511.09484), which optimizes tracking controls in physics simulation. **HuMoTAR instead uses agentic refinement to revise both the motion reference and manipulation controller.** The comparisons below follow each task from the human demonstration to execution by [Unitree G1](https://www.unitree.com/g1/) with Dex3 hands.

::: anchor execution-setup
::: anchor dynamic-interaction

<h3>Carry and place a chair</h3>

::: video intro-chair-comparison

<h3>Lift, carry and place a clothes stand</h3>

::: video intro-stand-comparison

::: anchor execution-task

**We posit that retargeting should preserve what the human accomplishes, while allowing the robot to change how it moves.** In HuMoTAR, the demonstrated object trajectory, scaled for G1, defines the interaction goal. The agents can revise posture, contacts, timing and control to follow that trajectory in simulation. The resulting references can also provide training data for downstream whole-body policies, as studied in [GMR](https://arxiv.org/abs/2510.02252).
