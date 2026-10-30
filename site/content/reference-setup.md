## 1. From human motion to humanoid interaction

::: anchor hoi-reference

**Motion retargeting translates a human demonstration into a reference motion for a robot.** Human and robot bodies differ in their proportions, joint limits and ranges of motion. Existing methods typically match the demonstrated body motion while adapting contact targets to the robot’s geometry.

**We posit that accurate and generalizable retargeting can use frontier agentic models to capture both the semantic intent and physical requirements of a motion.** The goal is to preserve what the human accomplishes with the object. The robot may need a different posture, grasp or sequence of movements to achieve that intent. In our experiments, we use the demonstrated object trajectory, scaled for G1, as the interaction target. Object-tracking error measures how closely the robot reproduces the desired object motion, while its own motion and contact strategy remain free to change.

::: anchor kinematic-setup

Retargeted references **can serve as training data for downstream whole-body control policies**, as studied in [GMR](https://arxiv.org/abs/2510.02252)’s analysis of retargeting and motion tracking. These policies learn to track the reference while maintaining balance and responding to physical forces. The quality of the reference therefore matters for the interactions a policy can learn.

### Why is a kinematic reference not enough?

A motion reference can match the demonstrated poses and still fail to move the object in simulation. **In the chair task, the unrefined HOI-Retarget motion fails to lift the chair; HuMoTAR completes the carry and placement.**

<h4>Carry and place a chair</h4>

::: video intro-kinematic

[HOI-Retarget](https://arxiv.org/abs/2609.34674) treats contact as part of the retargeting problem. It maps human motion and object-relative contact targets onto the humanoid, in our case [Unitree G1](https://www.unitree.com/g1/), then optimizes the robot motion to preserve them. The result specifies how the robot and object should move. In **Carry and place a chair (Fig. 1)**, we execute this unrefined reference with [SONIC](https://arxiv.org/abs/2511.07820) for whole-body tracking and the supplied finger targets. Contact does not support the lift. HuMoTAR instead refines the reference and manipulation controller using simulation feedback.

A geometric objective still has to reconcile body pose, joint limits and contact targets on a different embodiment. These constraints can compete. In **Push and pull a box (Fig. 2)**, the resulting body and hand configuration does not preserve a useful contact with the box. A reference can therefore require revision even before we ask a controller to execute it.

<h4>Push and pull a box</h4>

<div class="intro-box-example">

::: video intro-smallbox

</div>
