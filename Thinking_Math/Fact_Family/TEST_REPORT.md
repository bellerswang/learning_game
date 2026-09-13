# Fact Family Quest — child-perspective test notes

## Learner profile used for testing

- Seven years old, raised in London.
- Familiar with simple 2-times-table facts.
- Has seen the 5-times table, but remembers it mainly in order; jumps such as `5 × 8` are unreliable.
- Sensitive to visible failure and may stop if a question feels like a dead end.
- Enjoys continuing once a small run of success has created momentum.

## Current UK-English learning path

```text
2 → 5 → 10 → 3 → 4 → 8 → 6 → 7 → 9
```

This follows a gentle England-primary progression: secure 2, 5 and 10 first, then build towards 3, 4 and 8 before the less familiar 6, 7 and 9 tables.

The route is a difficulty-led interpretation of the England curriculum rather than a claim that every school teaches the tables in exactly this order. The official guidance highlights early fluency in 2, 5 and 10, then work with 3, 4 and 8, with recall of tables up to 12 × 12 expected by the end of Year 4.

## Workflow scenarios

### Scenario A — confident with 2× facts

```text
Learn ×2 → open 11 cards → 3 warm-ups → challenge
```

Expected effort:

- 1 learning visit
- 11 card opens
- 3 warm-up questions
- 1 challenge entry

The first warm-up is a random direct multiplication fact, not a sequential run. This checks recall without immediately introducing division.

### Scenario B — knows 5× facts only in order

The Times-table book shows every 5× fact from `5 × 2` through `5 × 12` and its two linked division facts. The warm-up uses a non-sequential direct fact such as `5 × 8`, followed by a turnaround fact, before missing-number work.

Expected effort:

- 1 table-book visit
- 11 card opens for ×5
- 3 warm-ups per visit
- 2–4 visits before the first independent challenge feels comfortable

The exact number depends on whether the child uses clues or parks facts for later.

### Scenario C — child hesitates or says “I don’t know”

```text
Show me the first step → try again
```

The help button changes to a clear action for the question type, such as `Show me the first step`, `Show me the family` or `Turn it into multiplication`. It reveals one concrete scaffold rather than asking the child to choose between several vague clue levels. No mastery credit is given for a supported answer, but previous progress is not removed.

Expected effort:

- 1 extra interaction: press `I’m not sure yet`
- 1–2 clue steps
- 1 supported answer
- 1 later independent retry

### Scenario D — child is emotionally stuck

```text
Park it for later → see the relationship → move to a fresh fact
```

The fact is not marked wrong and the child is not forced to repeat it immediately. A warm-up park still counts as one exposure, but not as an independent mastery win.

Expected effort:

- 1 tap to park
- 1 supported explanation
- 1 fresh question
- later retry after at least one different fact

### Scenario E — mixed fluency after several tables

The system should retain the same rescue behaviour but gradually increase the proportion of turnaround, missing-factor and division facts. A hard question must not appear twice in a row.

Expected effort:

- 8–12 minutes per session
- 3–5 small wins per session
- no requirement to finish the entire certification matrix in one sitting

### Scenario F — new learning without forgetting old tables

The progress map makes the next unlock visible and explains the three layers in order: multiplication, missing numbers, then division. Each family now includes factors 2 through 12. Once an earlier table is strong, roughly one in five challenge questions becomes a `Memory bridge` from an earlier table while the current table remains the main focus.

Expected behaviour:

- current-table questions remain the majority of the session
- earlier strong tables return as spaced, mixed recall
- a review question never changes the active table's unlock state
- a supported or parked review is recorded as an exposure, not a mastery win

## Evidence from the first live pass

- The first screen now uses UK English and avoids exposing the internal `231`-point workload.
- The Times-table book exposes all available tables, including tables that are not yet unlocked for practice.
- The current table must be explored before warm-up begins.
- Warm-up starts with direct multiplication, then turnaround multiplication, and only introduces a missing-factor item after two warm-up wins.
- Formal certification also opens in layers: multiplication first, missing-number facts next, and division only after the earlier layer has at least one independent win for every fact.
- The help button now gives one named, question-specific first step without exposing a vague `Show a clue` ladder.
- `Park it for later` lets the child leave a difficult question without being trapped.
- A wrong choice is visually muted rather than shown as a red failure state.
- The tested route remains usable after a wrong answer and after a parked question.
- Eight parked challenge questions trigger a gentle stopping point with `Finish for now` and `Keep going`; finishing returns to a visible `Continue challenge` button.
- The progress map now shows `Your next unlock`, the exact next table, and the three learning-layer states.
- The Times-table book still lets the learner inspect a locked table as a reference without making it available for practice.
- After an earlier table is certified, challenge sessions reserve about 20% of questions for gentle long-term-memory bridges from earlier tables.

## Times-table book visual pass

- The book now shows a compact ×2–×12 quick-look list with only the main multiplication facts. Division is no longer squeezed into each small row.
- Selecting a fact opens one large teaching card: groups of dots, the multiplication, its turnaround, and the linked division facts.
- `2 × 7` was checked in the live desktop preview: seven groups of two, `2 × 7 = 14`, `7 × 2 = 14`, `14 ÷ 2 = 7`, and `14 ÷ 7 = 2` appeared together.
- On the iPhone preview, selecting `2 × 11` scrolled the detailed card into view, with eleven groups of two and the correct linked equations.
- The locked ×5 table remained usable for reference. Selecting `5 × 12` showed twelve groups of five and `60 ÷ 5 = 12` / `60 ÷ 12 = 5`, while its warm-up button stayed disabled.
- The existing `seen` record remains intact; an unvisited fact is only marked explored after it is selected. The warm-up button still requires all 11 facts in the current table to be explored.

## Open optimisation questions for the next pass

1. Whether nine table cards are too many to explore in one sitting for this learner.
2. Whether the first 5× warm-up should use a visual grouping prompt before direct recall.
3. Whether a session should end automatically after three successful independent answers, even if the Family is not complete.
4. Whether the adult-facing exact certification numbers should move into a separate parent view.

## Effort model for one Family

The internal certification requirement is deliberately strict:

```text
11 facts (×2 through ×12) × 7 skill types × 3 independent passes = 231 certification wins
```

The child does not see that number. The session guardrail presents at most about 8 challenge questions before offering a stopping point.

| Learner state | Expected route | Estimated short sessions |
|---|---|---:|
| Strong with the table | 11-card study, 3 warm-ups, mostly independent challenge | 28–32 |
| Knows the sequence but not random jumps | Repeated mixed recall, occasional clues, delayed retries | 30–40 |
| Sensitive and frequently parks facts | More supported exposures and spaced returns | 40–60 |

These are planning estimates, not claims about a child’s actual pace. The product should celebrate each short session rather than expose the total.
