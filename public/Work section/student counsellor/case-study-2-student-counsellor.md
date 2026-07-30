# student counsellor

> maqsad's admissions counsellor for stressed out exam students. it guides them through navigating exams, prep options, and handles enrollment end to end.

`llm agent` · `tool calling` · `student psychology`

---

## the problem

students reach maqsad on whatsapp, from paid campaigns and organic both. we were getting a lot of leads, more than the sales team could actually handle.

a few things made this hard:

- students don't want to hop on calls. gen z texts. so whatsapp was the whole relationship, not a step toward one.
- the questions were not simple. exam patterns, weightages, merit, university options, counselling, prep plans. every student wanted a lot of detail before committing.
- these are high stakes exams. a student's whole future rides on the result, so they're stressed and they ask everything twice before they trust you enough to pay.
- most of them study or scroll late at night. our sales team was small and couldn't reply at odd hours, so leads went cold while they were waiting.

the sales team couldn't give every student that kind of attention, at that hour, at that volume. so students dropped off before they ever got to enrollment.

what they actually needed was a counsellor. someone who handholds them through the confusion first, builds trust, and only then moves them toward enrolling. the counselling is the funnel.

---

## why a counsellor, and why an llm

the obvious fix is "hire more sales people." that doesn't scale and it doesn't solve the actual problem. i looked at three options.

**more humans.** you can always add people, but you can't add enough to cover 500 leads a day, at 2am, each one asking detailed questions and needing to be walked through slowly. every new hire also has to be trained on exam patterns, merit, batch details, pricing. it gets expensive fast and it still breaks at odd hours.

**a rules or button-menu bot.** i ruled this out quickly. our students don't ask clean, predictable questions. they ask "mera aggregate itna hai, kya main is university mein aa jaunga" and "agar main abhi join karun to kitna time milega." a decision tree can't hold a conversation like that. the second a student goes off-script it dead-ends, and a dead-end is exactly what makes a stressed kid leave.

**an llm counsellor.** this was the only option that could do the job:

- it holds a natural back-and-forth in roman urdu and english, the way our students actually type
- it answers detailed, messy, out-of-order questions without breaking
- it runs 24/7, so the 2am student gets the same attention as the 2pm one
- it pulls real data through tools, so it's not just talking, it's quoting this student's actual status and our actual prices

the thing i cared about most: a rules bot responds, an llm counsels. a stressed student can tell the difference, and the difference is whether they trust us enough to pay.

---

## how it's wired

the counsellor is not a bot in a box. it sits behind our own middleware, reads a student's context on the way in, and acts on our backend systems on the way out.

here's the whole path a message takes:

![how a message travels: whatsapp to chatwoot to typebot to our middleware, which injects the phone number and runs the tool-use loop with the sonnet 5 agent on AWS, then sends the reply back to the student](./diagrams/01-message-flow.png)

the important bit: the model never talks to whatsapp or our database directly. when the model decides to call a tool, that request comes back to our middleware, the middleware runs the real backend call, and feeds the result back to the model. the model loops until it has a final reply. i own that loop.

![the tool-use loop: the model reads context and decides if it needs data or an action; if yes it emits a tool call, the middleware runs the real backend call and returns the result to the model, looping until it produces a final reply to the student](./diagrams/02-tool-loop.png)

this is also why the bot never asks a student for their phone number. the middleware pulls it from the chatwoot conversation and injects it as context. the model already knows who it's talking to.

> **screenshot to add here:** the murshid assistant config page (model = claude sonnet 5, the instructions/knowledge/tools tabs). it makes the whole "i built the platform this runs on" point land visually before the reader hits the detail.

---

## the tools

the agent has 9 tools. i think about them in two groups: the ones that run in a fixed sequence at the start of every conversation, and the ones the model decides to call in the moment.

**always run, in order, on every new conversation:**

| tool | what it does |
|---|---|
| `get-user-profile` | looks the student up by phone. returns name, enrolment, purchase history. returns null if they're new. |
| `create-user` | creates an account. only fires if the profile came back null. |
| `get-products` | fetches the products available for that exam. names, ids, prices. this is the price source of truth. |

**model decides, mid-conversation:**

| tool | what it does | what makes it fire |
|---|---|---|
| `get-user-products` | returns what the student already owns and how long their access is valid | before pitching or invoicing anything |
| `assign-label` | tags the conversation (intent-to-pay, affordability, free, verify-payment-ss) | when the model reads an intent signal |
| `create-slack-update` | posts to a slack leads channel | on real intent to pay |
| `generate-invoice` | generates a 1-Link payment invoice | when the student picks the invoice payment path |
| `assign-agent` | hands the conversation to a human, or to the right exam's counsellor, or unassigns the bot entirely | escalation, routing, or an irrelevant lead |
| `update-contact` | writes a confirmed phone number back onto the chatwoot contact | when the number needs correcting at source |

> **screenshot to add here:** the murshid tools tab showing all 9 toggled active. reinforces that these are real, configured tools, not a diagram i drew.

a few of these are worth the story behind them, because they're where the product thinking is.

### the two fetches that make it a counsellor and not a script

everything specific the bot says about *you* comes from a live call mid-conversation, not from the model's memory:

- **student fetch** (`get-user-profile`, keyed on phone): who they are, what they've enrolled in, what they've bought. this is how the bot greets a returning student by name and doesn't try to sell them something they already have.
- **product fetch** (`get-products`): the actual batches, prices, and features for that exam, pulled fresh every conversation.

so the bot is reading the student's real record and our real catalogue while it talks. that's the difference between "here are our courses" and "you're in the 2026 batch, here's what makes sense for you next."

### the slack ping is a speed-to-lead play

`create-slack-update` isn't just logging. we noticed that a student with intent to pay converts fastest if a human gets back to them within the minute, and if a real sales agent drops a voicenote it builds instant trust and they enroll. so the moment the bot reads genuine intent to pay, it posts that lead to a slack channel in real time, so a human can jump in while the student is still hot. the bot opens the door, the human closes it.

### assign-agent does three jobs

this one grew over time, and the third use is my favourite because it's about cost, not just conversation.

1. **handoff when the bot is out of its depth.** some questions are just better answered by a person. the model recognises that and passes the chat to a human.
2. **routing to the right counsellor.** each exam has its own agent. if an ECAT student lands in the MDCAT counsellor by mistake, the MDCAT agent hands them to the ECAT one. the agents can pass students between each other.
3. **unassigning irrelevant leads to stop burning tokens.** performance campaigns pull in a lot of junk leads. every junk lead the bot keeps replying to costs money. so when the bot recognises a chat is irrelevant, it marks it and unassigns itself (agent id `0` = none), and it stops responding. that one change took real cost off the table.

under the hood, `assign-agent` takes a chatwoot agent id, and each id is a real human or desk on our team. when the model calls it, chatwoot reassigns the conversation, the bot goes quiet, and a person owns it from there.

### assign-label gives the sales team a head start

when a human does pick up a chat, `assign-label` has already tagged it (intent-to-pay, affordability, free, and so on) so the agent knows what they're walking into before they open it. small thing, big difference to how fast the team can work a queue.

---

## the guardrail: it can't invent a price, a discount, or a validity

this is the part i'm most careful about, because a wrong price or a made-up merit number destroys trust instantly with a student whose future is on the line.

it started as a real failure. when the counsellor was just a prompt and a model, it hallucinated. and the way it hallucinated was very human: a student would express a financial worry, the model would feel for them, and it would offer a product for free or at a discount that did not exist. empathy, but expensive.

the fix was structural, not a stern instruction. i wired price and product to a function. any time the bot quotes a product, it can only use what `get-products` returns, the real products at their real prices. there is nothing to invent from.

on top of that:

- **`get-user-products` stops misselling.** before it pitches anything, the model checks what the student already owns and how long that access is valid. it can't sell someone a batch they already bought, and it reads validity off real data instead of guessing. this is the tool i lean on most.
- **discounts are structural, not verbal.** a student can't talk the bot into a discount. promo codes only apply inside the app, and the bot will never honor a claimed discount or invoice a custom amount.
- **a fallback price for the rare failure.** if the product fetch fails for any reason, the bot used to say "can't fetch," which dead-ends the conversation. so for that rare edge case i added a hardcoded fallback price, so the student still gets an answer and the chat keeps moving.

and a verified-facts foundation pins the things students most often ask about and most easily get wrong. the exam is 180 marks, full stop. it never calculates a student's merit, it sends them to the official calculator. anything it isn't sure of, it says is best confirmed on the official page rather than guessing.

---

## moving the exam knowledge out of the prompt

early on i did the obvious thing: i put everything in the system prompt. for MDCAT and ECAT that meant every university, every paper pattern, expected merits, dates, all of it, stuffed into the instructions.

it didn't work well. the prompt got huge and inefficient, and worse, the bot still hallucinated facts out of that wall of text and quoted wrong info to students.

so i moved all the static, exam-related information into a knowledge base file and turned on file search. now the bot fact-checks what it's about to say against that file instead of carrying it all in the prompt. the prompt got lighter and the answers got more accurate at the same time.

it also drew a clean line i now think is the right one: the **prompt** holds behaviour (persona, flow, rules, guardrails), the **knowledge base** holds facts (dates, patterns, merits, batch details). behaviour and facts change on different clocks, and keeping them apart means i can edit one without disturbing the other.

> **screenshot to add here:** the knowledge base with the exam-info file uploaded and file search on. it's the visual proof of the before/after (prompt-stuffed → knowledge base).

---

## why i built our own assistants platform

this is the biggest thing i took on, and it's worth explaining because it's not a model swap, it's a platform build.

we started on the openai assistants playground. the interface was already built, so we just added our functions and our system prompt. it worked, and it let us move fast early.

then openai deprecated the assistants api (announced august 2025, shutting down august 2026) and pushed everyone to the new responses api. that was a problem for us specifically: our entire CRM was wired to typebot and chatwoot, our middleware was built around that flow, and the whole sales team worked inside it every day. migrating to a different api shape would have meant re-plumbing all of it and retraining the team on a new way of working.

so instead of migrating onto someone else's new api, i built our own in-house assistants platform, **murshid**. i made sure it kept every piece of functionality we relied on, file search, tools, instructions, and added the thing the playground never gave us: **the ability to pick a different model per assistant.**

that last part is where it pays off. not every exam needs the same firepower:

![one platform, a model per exam: murshid routes simpler exams to a lighter model like haiku and complex exams like MDCAT and ECAT to a stronger model like sonnet or opus](./diagrams/03-model-routing.png)

a simpler exam type can run a lighter, cheaper model like haiku. a heavy exam like MDCAT or ECAT, with all its dates and merits and nuance, runs a stronger model like sonnet or opus. we route the model to the difficulty of the job.

the payoff was real on both axes: the responses were noticeably better than the gpt-5 setup we'd had before, **and** it came out cheaper. better and cheaper, on a platform we own and can change whenever we need to.

---

## how i defined a good counselling response

a good reply had to clear three bars at once:

- **empathy.** it meets a stressed student where they are, in their language, warm not robotic, and answers the actual question before it pushes anything. this is the bar i tuned the hardest, because early on the bot pitched enrollment in *every* reply and it annoyed people. i reshaped the persona into a senior counsellor who talks to a student like a friend and guides them like a teacher, not a bot trying to close on every message.
- **accuracy.** every student-specific fact and every price comes from a tool or the verified knowledge base. nothing invented.
- **knowing when to stop.** it recognises when it's out of its depth or the chat has turned irrelevant, and it hands off or unassigns instead of pushing.

---

## how i knew it was working, and how i caught it when it wasn't

reading 500 conversations a day by hand doesn't scale. so the counsellor doesn't grade itself, and i don't grade it manually either. every conversation is fed into a second agent that scores it.

**the eval loop:**

chatwoot pipes each finished conversation, both sides of the transcript, into a classifier agent. once a day it reads every chat and drops it into a bucket: qualified (with a sense of how strong the intent was), ghosted, irrelevant, or future prospect. i own the counsellor's job as one number: the share of conversations that land in the **qualified** bucket. if the bot is counselling well, more students come out the other side qualified. if that share moves, the bot's behaviour moved.

that gives me a daily read on quality without reading a single transcript, and it turns a fuzzy question ("is the bot good?") into a number i can watch.

> the full bucket taxonomy and how these scores also drive ad spend is its own system. i cover that in the acquisition-pipeline case study. here i'm only using the classifier for one thing: as the counsellor's report card.

**detection, then diagnosis.** the classifier tells me *that* something slipped, not *why*. so the loop is two steps: the qualified-rate drops, and then i go read the transcripts from that window to find the cause. the number is the smoke alarm, the transcripts are where i find the fire. every failure in the next section was caught this way, the metric flagged it, the transcript explained it.

> **screenshot to add here:** the classifier's daily bucket breakdown (qualified / ghosted / irrelevant / etc). it's the visual proof that eval is automated and running, not a story i'm telling after the fact. blur any student-identifying data.

---

## where it failed and what i changed

these are the real ones.

**it gave away free and discounted products out of empathy.**
when a student pleaded about money, the model would sympathise and offer a discount or free access that didn't exist. i fixed it structurally by wiring all pricing to `get-products`, so the bot can only ever quote real products at real prices. there's nothing left to invent. (this is the origin of the whole guardrail above.)

**it pitched enrollment in every single message.**
it read as pushy, and pushy is poison for a stressed student. i rebuilt the persona into a friendly senior counsellor, someone who gets how to talk to a student as a friend and guide them as a teacher, and answers the real question before nudging toward enrollment.

**it re-asked questions students had already answered.**
this was a subtle one. whatsapp students don't answer in one clean message, they spread a single thought across three or four messages. the bot was treating each incoming message as a separate turn and responding to each one, so it would ask a qualifying question the student had actually already answered a message or two ago. the fix was to make the bot read the full thread history and check whether a question had already been answered before asking it, plus a cap so it never asks the same detail more than twice.

**the fetch could dead-end the chat.**
if `get-products` failed, the bot said "can't fetch" and the conversation stalled. i added a hardcoded fallback price for that rare case so the student always gets an answer and the chat keeps moving.

---

## the tradeoffs

- **a counsellor that sells is a fine line.** push too hard and a stressed student feels sold to, which is the opposite of trust. i kept pulling the bot back toward helping first, pitching second. it's a balance i'm still tuning, not a solved problem.
- **structural guardrails are safer but more rigid.** wiring price to a function means the bot literally cannot be flexible on price, even when a human might read the room and bend. that's the right call for trust and cost, but it's a real trade, and it's why the human handoff exists.
- **prompt vs knowledge base is a discipline, not a free win.** splitting behaviour and facts keeps things clean, but it means i have to be deliberate about what belongs where. it's worth it.
- **owning the platform means owning the maintenance.** murshid is ours, which is the whole point, but it also means when something needs fixing, it's on us, not a vendor. i'd make the same call again.

---

## the numbers

the one i own directly:

- **qualified lead rate went from 30% to 85%+.** this is the counsellor's own report card, the share of conversations the classifier scored as qualified. it's the cleanest measure of whether the bot is doing its actual job, and it's the number i watched to catch regressions.

the rest:

- **500+ leads a day** handled by the counsellor
- **~95%** cut in manual chat handling by the sales team
- **24/7** coverage, the 2am student gets the same reply as the 2pm one
- **9 tools**, one counsellor pattern, deployed across multiple exams
- **cheaper than the previous gpt-5 setup**, with better responses, after moving to murshid

and the outcome it feeds into:

- **conversion went from 2% to 10%.** i want to be honest about attribution here: that's the whole acquisition system moving, ad targeting, lead scoring, and the counsellor together, not the bot alone. the counsellor's contribution to it is the qualified-rate above. i'd rather claim the number i can cleanly own and be straight about the one i share.

---

## what i'd improve next

- **re-engagement.** right now a lead that goes quiet stays quiet. the obvious next build is a scheduled follow-up that reaches back out to a stalled student within whatsapp's messaging rules, so we don't lose the ones who just got busy or scared.
- **sharper eval.** the classifier gives me a daily qualified-rate, which is a great smoke alarm but a blunt one. it tells me the bot slipped, not which replies caused it. next i'd score conversations against the three bars directly (empathy, accuracy, knowing when to stop) so a bad reply gets flagged on its own terms, and i'd run a prompt change against a held-out set of past problem chats before shipping, so i can prove a fix helped instead of watching the next day's number and hoping.
- **smarter model routing.** murshid lets me pick a model per exam. the next step is being sharper about which conversations genuinely need the heavier model, so we spend the expensive tokens only where they change the answer.
