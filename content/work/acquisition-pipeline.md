# The three agent acquisition pipeline

## Card

**Title:** The three agent acquisition pipeline

**Outcome:** I built and own a three agent WhatsApp funnel, a sales bot, an intent classifier, and a campaign analyser, that took conversion from 2% to 10%. The classifier's high intent cohort converts at ~13%, the highest of any bucket.

**Tags:** `multi agent system` · `lead classification` · `conversion 2%→10%`

---

# summary

- every day 1,000+ students land in our whatsapp from meta and google ads, and lead quality and campaign performance were assessed manually by a team member reading chats and forming a judgement, and we couldn't assess every campaign, every day, down to the individual creative
- so we built three AI agents that run maqsad's whatsapp acquisition end to end
- **the sales bot** talks to every student and runs them through qualifying questions (holds a real conversation)
- **the classifier** reads the finished conversation and buckets it by intent, the label sales team actually acts on
- **the campaign analyser** joins lead quality back to the exact meta creative, so spend is optimised for the ads that bring real candidates
- whole funnel conversion went from 2% to 10%, the "qualified" label went from ~30% to ~85% precision, and the high intent cohort converts at ~13%, the highest of any bucket

# what we were solving

maqsad runs student acquisition on whatsapp. a student taps a meta or google ad, lands in our whatsapp, and three AI agents take it from there. this is what we were up against before them.

## how it worked before

- we were changing campaigns, budgets, audiences, and creatives every week off gut, based on someone reading chats and forming an opinion
- early on our response rate was really low, so we just wanted students who replied. "qualified" meant anyone who wrote back
- as replies picked up that stopped being useful. "ok" counted the same as a serious MDCAT student
- two ceilings we couldn't get past by hand:
  - we couldn't assess every campaign, every day, down to the individual creative. at 1,000+ conversations a day it's not humanly possible
  - "replied" had to start meaning a real candidate having a real conversation, and no rule could draw that line

## why build agents

- the signal lives in how students talk, not in keywords. you can't regex your way from "sir class timings kya hain" to a student who's ready to pay
- students write in a mix of english and roman urdu, and most don't use a real name on whatsapp
- i needed something that reads a full conversation the way a rep would, at a volume no team can handle
- the sales bot is the same problem from the other side. it holds a real conversation instead of walking a menu. [read the full build in the student counsellor case study →](#cs-student-counsellor)

## how i defined a good output

- label a conversation the way i would if i read it myself
- not two buckets. the real texture of how people talk to us:

| bucket | sub tiers | means |
|---|---|---|
| **qualified** | high / medium / low / cannot afford | a real candidate having a real conversation |
| **no response** |  | ghosted after the preset |
| **irrelevant** |  | wrong exam, spam, or flagged by an agent after a call |
| **future prospect** |  | a student for the next cycle |

- at the system level, "good" meant more than a correct label. the right lead lands with the right rep fast, and the money follows the creatives that bring good leads

# how we built it

## the three agents

three agents, each owning one job and handing the lead down the line.

| agent | job | how it works |
|---|---|---|
| **1 · sales bot** | talks to every student, runs them through qualifying questions | conversational agent, not a menu tree. [read the full build →](#cs-student-counsellor) |
| **2 · classifier** | reads the finished conversation and buckets it by intent | python plus an llm on claude code, reading chats from the chatwoot api |
| **3 · campaign analyser** | tells me which campaigns and creatives are worth the spend | sits on the meta api, joins lead quality back to the exact creative |

## how a lead moves from 0 to 1

- student taps an ad, lands in whatsapp, and the sales bot talks first
- once there are enough real answers, the classifier reads the full conversation out of chatwoot and buckets it
- that firing hands the lead to sales: a function drops it into a slack channel and tags the rep who should call
- every chat carries the meta ad ID that brought it. that's the join. lead quality flows back to the exact creative, and the analyser uses it to move spend. that's the loop closing

![the three agent pipeline | a student taps an ad into whatsapp, the sales bot qualifies, the classifier buckets by intent and hands qualified leads to a rep via slack, and the campaign analyser joins lead quality back to the exact creative to move ad spend](/images/work/pipeline/three-agent-pipeline.svg)

# how it performed

## how i checked and refined it

- first week: i read close to 100 chats a day and classified every one by hand, then checked the agent against my labels on the same chats
- no clever harness. just reading transcripts until the disagreements got rare
- i made ghost rate its own tracked metric, because "no response" is a huge and honest slice of reality the old "replied = qualified" model was hiding

## what broke

- **it tagged high intent students as low.** a kid asking detailed questions about the test looks like noise if you're only watching for the word "fees", but that kid is often the one about to enroll
- **gender was a mess.** gender matters here because women convert better, so sales prioritises accordingly. but most students use emojis or a nickname on whatsapp, so there was nothing to read it off
- **the fix for both: stop reading names and metadata, read the language.**
  - urdu marks gender in its verbs. "karta" vs "karti" tells you more than any display name. we trained the classifier on gendered verb forms in roman urdu and english
  - i rebuilt the intent signals around what students actually do in a chat, the clarifying questions, the timing asks, the affordability tells, instead of a keyword list
- accuracy climbed after that and held at ~98% agreement with my labels

## the tradeoff

- the real tension was when to classify. the agent scores after a set of qualifying questions, not on the first message
- that costs a little time before a lead is labelled and handed off. i took that hit on purpose
- a label off one message is a guess, and a wrong "low intent" tag means a real buyer gets deprioritised
- i clawed the time back on the other end. classification fires the slack handoff instantly, so "qualified" to "a human is dialling" is minutes. the qualifying cost was tiny next to the revenue from the leads it fast tracks

## what the setup gives us now

- ~3,400 unique leads in april. 44% qualified, 37% ghosted after the preset
- whole funnel conversion moved from 2% to 10% over a 45 to 60 day window
- the classifier hits ~98% agreement with my manual labels on unseen chats
- the "qualified" label went from ~30% precision under the old rule to ~85% under the classifier

**does the label actually predict revenue, or is it grading its own homework?** i tested it. we handed sales only the high intent cohort and measured:

| cohort | leads | conversion |
|---|---|---|
| **high intent** | 246 | **~13%** (highest of any bucket) |
| medium intent | 745 | ~0.4% |
| low intent | 388 | ~1% |
| ghosted | 1,266 | ~1.2% |

- high intent converted an order of magnitude better than every other bucket. the label predicts money, not just my opinion
- the high intent group is smaller in absolute terms right now because students are mid second year and A Level exams, so this is a result about conversion quality, not volume

**the analyser earned its place with one clear pattern:**

- creatives that didn't put the exam name big and obvious pulled irrelevant leads
- for O Level, a generic "math" did worse than spelling the exam out clearly
- because every chat carries its ad ID, i could point at the exact creative producing ghosts vs high intent leads, kill the weak ones, and move budget to what worked. that's the loop, running daily

## what i'd improve next

- the analyser tells me what's worth it, but i still move the budget myself. next step: close that loop so strong signals adjust spend inside guardrails i set, instead of me pushing every button
- run the conversion test across older lead sets, not just april, to confirm the high intent premium holds across cycles and isn't seasonal
