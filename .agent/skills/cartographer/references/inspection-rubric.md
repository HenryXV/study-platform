# Inspection Rubric

When analyzing a module or file, ask yourself these 5 questions. If the answer is "Yes", record it for the map.

## 1. The "What is it?" Check
* **Purpose:** In one sentence, what problem does this file solve?
* *Example:* "Authenticates users via OAuth." (Good) vs "Import functions..." (Bad)

## 2. The "Public API" Check
* **Exports:** What functions/components are *intended* for other modules to use?
* *Ignore:* Helper functions not exported or marked private.

## 3. The "Dependency" Check
* **Upstream:** What critical services does this rely on? (e.g., Database, Stripe, Redis)
* **Downstream:** Who relies on this? (e.g., "Used by CheckoutPage")

## 4. The "Systemizer" Pattern Check
* **Compliance:** Does this follow our `next-best-practices`? (e.g., Is it using SWR? Is it a Server Component?)
* **Violation:** Are there "Waterfalls" or "Barrel Imports"? Note them as "Gotchas".

## 5. The "Gotcha" Check
* **Edge Cases:** Is there hidden behavior? (e.g., "Fails if Redis is down", "Requires ENV_VAR_X")