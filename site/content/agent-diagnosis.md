## 4. Inside the refinement process

::: anchor reference-deviation

### 4.1 How does the agent refine an interaction in simulation? {#kinematic-to-dynamic}

We begin with a human demonstration and an initial G1 motion from HOI-Retarget. The scaled object trajectory defines the interaction goal, while the robot's motion and controller remain open to refinement. Figure 6 shows how Astra turns this starting reference into a program that can be executed, inspected and revised in simulation.

**Astra writes executable Python code.** The code can construct wrist trajectories, solve inverse kinematics for arm and waist joints, adjust finger targets, and change the duration of individual motion phases. Across the recorded runs, agents also implement joint-impedance control, object-pose feedback and contact-dependent transitions; some try constrained inverse dynamics to compute joint torques. These strategies are implemented in the generated program, together with any revised reference trajectories and initialization.

Physical execution requires whole-body control to support the robot and hand control to manipulate the object. We use **[SONIC](https://arxiv.org/abs/2511.07820) as a frozen whole-body policy**, tracking a motion reference at 50 Hz. Its 29 body joints include the arms and wrists, but not the Dex3 fingers. To control the interaction, Astra writes a **custom hand and arm controller in Python**. This controller commands the fingers and, when needed, replaces SONIC’s arm commands with targets, gains and feedforward torques suited to the task.

The agent can also revise the motion reference supplied to SONIC so that whole-body control follows the intended arm motion. During each rollout, SONIC and the custom hand and arm controller produce the joint commands. Astra inspects the resulting execution and revises the code or reference before the next trial.

[MuJoCo](https://mujoco.org/) executes the combined joint commands and records the resulting robot and object motion. Astra can inspect rendered views, tracking errors, contact locations and forces, joint limits and collision clearances. It uses this feedback to revise the next candidate, then tests the complete interaction again. The retained result includes the executed reference motion and the controller needed to replay it. The examples in Figure 6 show the kinds of changes made within this loop.

::: component refinement-considerations
