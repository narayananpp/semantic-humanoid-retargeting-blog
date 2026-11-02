## 4. Qualitative results

::: anchor reference-deviation

### 4.1 Iterative refinement of motion and control {#kinematic-to-dynamic}

::: component refinement-architecture

The architecture above takes a human demonstration and an initial kinematic reference through code generation, simulation and iterative refinement. Simulation feedback returns to the agent to guide the next revision.

We now examine how the agents use simulation feedback to improve an interaction. Astra refines both the motion reference and the code that controls the interaction. Its revisions include changes to grasp placement, body posture and the timing of lifting or release. Each revision is tested in simulation before the next decision. The examples below show these changes, the feedback that prompted them and their effect on execution.

### 4.2 Refining contact, support and motion {#refining-contact-support-motion}

::: component refinement-considerations
