## 1. From human motion to humanoid interaction

::: anchor hoi-reference

**Motion retargeting translates a human demonstration into a reference motion for a robot.** A person and a humanoid have different proportions, joint limits and ranges of motion. Retargeting accounts for these differences while preserving features of the demonstration, such as the path of a hand, the placement of a foot or contact with an object.

::: anchor kinematic-setup

These references supply training data for humanoid policies, as studied in [GMR](https://arxiv.org/abs/2510.02252)’s analysis of retargeting and motion tracking. Rather than designing each movement by hand, we can learn a controller that tracks retargeted demonstrations while maintaining balance and responding to physical forces. This makes retargeting an important part of the data pipeline for interactive humanoid systems.

### What does a kinematic reference provide?

<div class="intro-reference-videos">

<div class="intro-reference-example">
<h4>Carry and place a chair</h4>

::: video intro-kinematic

</div>

<div class="intro-reference-example">
<h4>Push and pull a box</h4>

::: video intro-smallbox

</div>

</div>

[HOI-Retarget](https://arxiv.org/abs/2609.34674) treats contact as part of the retargeting problem. It maps human motion and object-relative contact targets onto the humanoid, in our case [Unitree G1](https://www.unitree.com/g1/), then optimizes the robot motion to preserve them. The result specifies how the robot and object should move. **Carry and place a chair (Fig. 1)** shows the intended interaction in a kinematic replay, without advancing physics.

A geometric objective still has to reconcile body pose, joint limits and contact targets on a different embodiment. These constraints can compete. In **Push and pull a box (Fig. 2)**, the resulting body and hand configuration does not preserve a useful contact with the box. A reference can therefore require revision even before we ask a controller to execute it.
