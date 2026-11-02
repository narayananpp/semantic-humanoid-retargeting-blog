## 4. Qualitative results

::: anchor reference-deviation

### 4.1 Iterative refinement of motion and control {#kinematic-to-dynamic}

::: component refinement-architecture

The architecture above shows how Astra uses a human demonstration and an initial kinematic reference to generate motion and control code. The agent tests each revision in simulation and uses the feedback to adjust grasp placement, body posture and the timing of lifting or release. The examples below show these changes, the feedback that prompted them and their effect on execution.

### 4.2 Refining contact, support and motion {#refining-contact-support-motion}

::: component refinement-considerations
