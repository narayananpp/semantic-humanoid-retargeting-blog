## 3. Evaluation metrics {#dynamics-metrics}

We evaluate **20 HUMOTO and 20 OMOMO tasks** using object-tracking errors and semantic success. Object tracking compares the simulated object motion with the demonstrated trajectory scaled for G1. We do not require the object to reach each position at the same time in the human demonstration and the robot execution, since the robot may move at a different speed. Instead, we compare corresponding stages of the object’s motion.

- **Mean ADD (cm):** The average distance between corresponding points on the object at aligned poses. It captures both position and orientation error. **Lower is better.**
- **Position error (cm):** The average distance between the simulated and target object positions. **Lower is better.**
- **Orientation error (°):** The average angular difference between the simulated and target object orientations. **Lower is better.**
- **Semantic success:** Astra compares the human SMPL video with the executed robot video and judges whether the robot completes the intended task. Each task receives a **PASS or FAIL** judgment. Across tasks, we report the percentage that pass. **Higher is better.**

Object-tracking errors are averaged equally across tasks. The [evaluation protocol](#semantic-evaluation) provides the judge prompt and review criteria.
