### From a reference to physical execution

::: anchor execution-setup

A kinematic reference describes the intended motion, but executing it requires the robot to balance, establish contact and support the object's weight. **[SPIDER](https://arxiv.org/abs/2511.09484)** addresses this gap through sampling-based optimization in physics simulation. We combine it with HOI-Retarget to evaluate whether the retargeted motions can be executed by G1 with Dex3 hands.

Physics-based optimization can improve execution, but complex interactions may require a different grasp, posture or sequence of movements. In the clothes-stand example below, HOI-Retarget + SPIDER loses balance and tips the stand. HuMoTAR refines the motion and controller to lift, transport and place the same object.

::: video intro-dynamics

::: anchor execution-task

**We posit that accurate and generalizable retargeting requires foundational priors that capture both the semantic intent and physical requirements of a motion.** The robot should accomplish what the human does to the object, while adapting its own posture, contact strategy and timing. In our experiments, the demonstration supplies an object trajectory scaled for G1. That target stays fixed; the robot’s motion and controller can change.

HuMoTAR uses an agentic harness to make these revisions through simulation feedback. An off-the-shelf model writes motion and control code, tests the interaction, and revises its solution from the observed execution. We study this process across [HUMOTO](https://arxiv.org/abs/2504.10414) and [OMOMO](https://arxiv.org/abs/2309.16237), then examine when reports from related skills help a new interaction.
