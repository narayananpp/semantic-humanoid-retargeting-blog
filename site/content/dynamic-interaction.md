### From a kinematic reference to physical execution

::: anchor execution-setup

A kinematic replay prescribes the robot and object poses without testing the forces needed to produce them. In physics simulation, the robot must establish contact, support the object's weight and maintain balance. **The unrefined chair reference fails to lift the chair; HuMoTAR carries and places it.** We execute the HOI-Retarget reference with [SONIC](https://arxiv.org/abs/2511.07820) for whole-body tracking and the supplied finger targets, then compare it with HuMoTAR's refined motion and manipulation controller.

<h4>Carry and place a chair</h4>

::: video intro-chair-physics

**[SPIDER](https://arxiv.org/abs/2511.09484)** uses sampling-based optimization in physics simulation to find controls that track a reference. We combine it with HOI-Retarget to evaluate execution on G1 with Dex3 hands. **In the clothes-stand task, HOI-Retarget + SPIDER loses balance and tips the stand; HuMoTAR lifts, carries and places it.**

<h4>Lift, carry and place a clothes stand</h4>

::: video intro-dynamics

Physics-based optimization can improve execution, but complex interactions may require a different grasp, posture or sequence of movements. HuMoTAR can revise both the reference motion and the interaction controller using feedback from execution.

::: anchor execution-task

**We posit that accurate and generalizable retargeting requires foundational priors that capture both the semantic intent and physical requirements of a motion.** The robot should accomplish what the human does to the object, while adapting its own posture, contact strategy and timing. In our experiments, the demonstration supplies an object trajectory scaled for G1. That target stays fixed; the robot’s motion and controller can change.

HuMoTAR uses an agentic harness to make these revisions through simulation feedback. An off-the-shelf model writes motion and control code, tests the interaction, and revises its solution from the observed execution. We study this process across [HUMOTO](https://arxiv.org/abs/2504.10414) and [OMOMO](https://arxiv.org/abs/2309.16237), then examine when reports from related skills help a new interaction.
