# The three-agent acquisition pipeline

## Card

**Title:** The three-agent acquisition pipeline

**Outcome:** I built and own a three-agent WhatsApp funnel, a sales bot, an intent classifier, and a campaign analyser, that took conversion from 2% to 10%. The classifier's high-intent cohort converts at ~13%, the highest of any bucket.

**Tags:** `multi-agent system` · `lead classification` · `conversion 2%→10%`

---

## Body

Maqsad runs student acquisition on WhatsApp. A student taps a Meta or Google ad, lands in our WhatsApp, and three AI agents take it from there. I built and own how the three behave together.

### How it worked before

- We were changing campaigns, budgets, audiences, and creatives every week off gut, based on someone reading chats and forming an opinion.
- Early on our response rate was really low, so we just wanted students who replied. "Qualified" meant anyone who wrote back.
- As replies picked up that stopped being useful. "ok" counted the same as a serious MDCAT student.
- Two ceilings we couldn't get past by hand:
  - We couldn't assess every campaign, every day, down to the individual creative. At 1,000+ conversations a day it's not humanly possible.
  - "Replied" had to start meaning a real candidate having a real conversation, and no rule could draw that line.

### The three agents

| Agent | Job | How it works |
|---|---|---|
| **1 · Sales bot** | Talks to every student, runs them through qualifying questions | Conversational agent, not a menu tree. Full build in its own case study. |
| **2 · Classifier** | Reads the finished conversation and buckets it by intent | Python plus an LLM on Claude Code, reading chats from the Chatwoot API |
| **3 · Campaign analyser** | Tells me which campaigns and creatives are worth the spend | Sits on the Meta API, joins lead quality back to the exact creative |

### How a lead moves from 0-1

- Student taps an ad, lands in WhatsApp, and the sales bot talks first.
- Once there are enough real answers, the classifier reads the full conversation out of Chatwoot and buckets it.
- That firing hands the lead to sales: a function drops it into a Slack channel and tags the rep who should call.
- Every chat carries the Meta ad ID that brought it. That's the join. Lead quality flows back to the exact creative, and the analyser uses it to move spend. That's the loop closing.

[ three-agent pipeline diagram goes here ]

### Why build agents

- The signal lives in how students talk, not in keywords. You can't regex your way from "sir class timings kya hain" to a student who's ready to pay.
- Students write in a mix of English and Roman Urdu, and most don't use a real name on WhatsApp.
- I needed something that reads a full conversation the way a rep would, at a volume no team can handle.
- The sales bot is the same problem from the other side. It holds a real conversation instead of walking a menu. Full build in its own case study.

### How I defined a good output

- Label a conversation the way I would if I read it myself.
- Not two buckets. The real texture of how people talk to us:

| Bucket | Sub-tiers | Means |
|---|---|---|
| **Qualified** | high / medium / low / cannot-afford | A real candidate having a real conversation |
| **No response** | — | Ghosted after the preset |
| **Irrelevant** | — | Wrong exam, spam, or agent-flagged after a call |
| **Future prospect** | — | A student for the next cycle |

- At the system level, "good" meant more than a correct label. The right lead lands with the right rep fast, and the money follows the creatives that bring good leads.

### How I checked and refined it

- First week: I read close to 100 chats a day and hand-classified every one, then checked the agent against my labels on the same chats.
- No clever harness. Just reading transcripts until the disagreements got rare.
- I made ghost rate its own tracked metric, because "no response" is a huge and honest slice of reality the old "replied = qualified" model was hiding.

### What broke

- **It tagged high-intent students as low.** A kid asking detailed questions about the test looks like noise if you're only watching for the word "fees", but that kid is often the one about to enroll.
- **Gender was a mess.** Gender matters here because women convert better, so sales prioritises accordingly. But most students use emojis or a nickname on WhatsApp, so there was nothing to read it off.
- **The fix for both: stop reading names and metadata, read the language.**
  - Urdu marks gender in its verbs. "Karta" vs "karti" tells you more than any display name. We trained the classifier on gendered verb forms in Roman Urdu and English.
  - I rebuilt the intent signals around what students actually do in a chat, the clarifying questions, the timing asks, the affordability tells, instead of a keyword list.
- Accuracy climbed after that and held at ~98% agreement with my labels.

### The tradeoff

- The real tension was when to classify. The agent scores after a set of qualifying questions, not on the first message.
- That costs a little time before a lead is labelled and handed off. I took that hit on purpose.
- A label off one message is a guess, and a wrong "low intent" tag means a real buyer gets deprioritised.
- I clawed the time back on the other end. Classification fires the Slack handoff instantly, so "qualified" to "a human is dialling" is minutes. The qualifying cost was tiny next to the revenue from the leads it fast-tracks.

### What the setup gives us now

- ~3,400 unique leads in April. 44% qualified, 37% ghosted after the preset.
- Whole-funnel conversion moved from 2% to 10% over a 45 to 60 day window.
- The classifier hits ~98% agreement with my manual labels on unseen chats.
- The "qualified" label went from ~30% precision under the old rule to ~85% under the classifier.

**Does the label actually predict revenue, or is it grading its own homework?** I tested it. We handed sales only the high-intent cohort and measured:

| Cohort | Leads | Conversion |
|---|---|---|
| **High intent** | 246 | **~13%** (highest of any bucket) |
| Medium intent | 745 | ~0.4% |
| Low intent | 388 | ~1% |
| Ghosted | 1,266 | ~1.2% |

- High intent converted an order of magnitude better than every other bucket. The label predicts money, not just my opinion.
- The high-intent group is smaller in absolute terms right now because students are mid second-year and A Level exams, so this is a conversion-quality result, not a volume one.

**The analyser earned its place with one clear pattern:**

- Creatives that didn't put the exam name big and obvious pulled irrelevant leads.
- For O Level, a generic "Math" did worse than spelling the exam out clearly.
- Because every chat carries its ad ID, I could point at the exact creative producing ghosts vs high-intent leads, kill the weak ones, and move budget to what worked. That's the loop, running daily.

### What I'd improve next

- The analyser tells me what's worth it, but I still move the budget myself. Next step: close that loop so strong signals adjust spend inside guardrails I set, instead of me pushing every button.
- Run the cohort-conversion test across older lead sets, not just April, to confirm the high-intent premium holds across cycles and isn't seasonal.
