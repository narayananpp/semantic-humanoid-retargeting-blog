## Comparing refinement with and without experience

We investigate whether experience from related interactions helps a robot retarget a new task. Here, G1 must raise a shelf from lying on its side to standing upright. The experience consists of reports from four other furniture tasks, including carrying a table and lifting a chair. These reports summarize the strategies tested and their outcomes.

We first run four agents for **15 minutes**, two with optional access to the provided retargeting tools, and select the best valid shelf motion. From this checkpoint, we run two separate **15-minute continuations**: one receives the reports, and the other continues without them. Both use the same model, tools and starting solution, with **30 minutes of total refinement**. This comparison measures the benefit of the supplied experience under an equal refinement budget.
