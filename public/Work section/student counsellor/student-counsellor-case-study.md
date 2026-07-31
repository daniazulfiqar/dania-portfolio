# student counsellor

maqsad's admissions counsellor for stressed-out exam students. it guides them through exams, prep options, and handles enrollment end to end.

llm agent · tool calling · student psychology

## summary

- students reach us on whatsapp faster than a small sales team can answer, at all hours, with high-stakes questions
- i built an llm counsellor that holds a real conversation in roman urdu and english, pulls each student's actual data and our actual prices through tools, and runs 24/7
- qualified lead rate went from 30% to 85%+
- 500+ leads a day handled by the bot, so the sales team could focus on converting instead of qualifying (~95% of chats now handled by the bot)

## the problem

- students reach maqsad on whatsapp, from paid campaigns and organic both
- we were getting more leads than the sales team could actually handle
- gen z texts. they don't want calls. so the entire conversation, start to enrollment, happens on whatsapp
- the questions were not simple: exam patterns, weightages, merit, university options, prep plans. every student wanted detail before committing
- these are high-stakes exams. a student's whole future rides on the result, so they're stressed and ask everything twice before they trust you enough to pay
- most of them study or scroll late at night, and a small team couldn't reply at odd hours. leads went cold while they waited
- so students dropped off before they ever got to enrollment

what they actually needed was a counsellor. someone who handholds them through the confusion first, builds trust, and only then moves them toward enrolling. the counselling is the funnel.

## why a counsellor, and why an llm

there were three options.

- **more humans.** we didn't have the resources to hire a team big enough to cover 500 leads a day at 2am, each asking detailed questions and needing to be walked through slowly. every hire also has to be trained on patterns, merit, batches, pricing. expensive, and it still breaks at odd hours
- **a rules or button-menu bot.** ruled out fast. our students don't ask clean questions, and they don't always type in plain english, it's often roman urdu. they ask things like whether their aggregate is enough for a specific university, or how much time they'd get if they joined today. a decision tree can't hold that. the second a student goes off-script it dead-ends, and a dead-end is what makes a stressed kid leave
- **an llm counsellor.** the only option that could do the job

what the llm gave me that the others couldn't:

- holds a natural back-and-forth in the roman urdu and english our students actually type
- answers messy, out-of-order questions without breaking
- runs 24/7, so the 2am student gets the same attention as the 2pm one
- pulls real data through tools, so it quotes this student's actual status and our actual prices, not a generic pitch

the thing i cared about most: a rules bot responds, an llm counsels. a stressed student can tell the difference, and the difference is whether they trust us enough to pay.

## what good counselling looks like

before building anything, i pinned down what a good reply has to do. everything after this serves these three bars.

- **empathy.** meet a stressed student where they are
  - in their language, warm not robotic
  - answer the actual question before pushing anything
- **accuracy.** every student-specific fact and every price is real, pulled from a tool or the verified knowledge base. nothing invented
- **knowing when to stop.** recognise when it's out of its depth or the chat has gone irrelevant, and hand off or unassign instead of pushing

the rest of this is how the build hits each bar, and where it missed and i had to fix it.

## how it's wired

when a message comes in from a lead, it doesn't go straight to the model. it passes through our own middleware first, which pulls that student's context on the way in and runs any backend action on the way out.

the path a message takes:

- whatsapp to chatwoot and typebot
- into our middleware
- to the sonnet 5 agent on aws
- and the reply back the same way

> [diagram: keep your message-path diagram here]

the important bit:

- the model never talks to whatsapp or our database directly
- when the model wants a tool, the request comes back to our middleware
- the middleware runs the real backend call and feeds the result back to the model
- the model loops until it has a final reply. i own that loop

> [diagram: keep your tool-use loop diagram here]

- this is also why the bot never asks a student for their phone number. the middleware pulls it from the chatwoot conversation and injects it as context. the model already knows who it's talking to

### handling voicenotes

- a lot of students don't type, they send voicenotes
- so i wired a transcription model into the same middleware path. the voicenote gets transcribed, and the text is what the counsellor responds to
- one catch: a very long voicenote (5-6 minutes) eats a lot of tokens to transcribe
- so there's a fallback. past a length threshold, instead of transcribing the whole thing, the bot replies asking the student to send a shorter message

## the tools

the agent has 9 tools. two groups: the ones that run in a fixed sequence at the start of every conversation, and the ones the model decides to call in the moment.

**always run, in order, on every new conversation:**

| tool | what it does |
|---|---|
| `get-user-profile` | looks the student up by phone. returns name, enrolment, purchase history. null if new |
| `create-user` | creates an account. only fires if the profile came back null |
| `get-products` | fetches the products for that exam: names, ids, prices. the price source of truth |

**the model decides, mid-conversation:**

| tool | what it does | what makes it fire |
|---|---|---|
| `get-user-products` | what the student already owns and how long access is valid | before pitching or invoicing |
| `assign-label` | tags the conversation (intent-to-pay, affordability, free, verify-payment-ss) | when the model reads an intent signal |
| `create-slack-update` | posts to a slack leads channel | on real intent to pay |
| `generate-invoice` | generates a 1-Link payment invoice | when the student picks the invoice path |
| `assign-agent` | hands off to a human, routes to the right exam's counsellor, or unassigns the bot | escalation, routing, or an irrelevant lead |
| `update-contact` | writes a confirmed phone number back onto the chatwoot contact | when the number needs correcting at source |

> [diagram or screenshot: pair these two together, the tool-definitions list and the create-new-tool modal, so the reader sees the full list and how one is built]

each tool is a real, configured definition: a description the model reads, an implementation key that maps to a backend action, and a json schema for its inputs.

a few are worth the story, because they're where the product thinking is.

### the two fetches that make it a counsellor, not a script

everything specific the bot says about you comes from a live call mid-conversation, not the model's memory.

- **student fetch** (`get-user-profile`, keyed on phone): who they are, what they've enrolled in, what they've bought. this is how the bot greets a returning student by name and doesn't sell them something they already have
- **product fetch** (`get-products`): the actual batches, prices, and features for that exam, pulled fresh every conversation

- that's the difference between "here are our courses" and "you're in the 2026 batch, here's what makes sense for you next"

### the slack ping gets a human in fast

- a lead with intent to pay converts fastest if a human gets back within the minute
- if a real agent drops a voicenote, it builds instant trust and they enroll
- so the moment the bot reads genuine intent, it posts the lead to slack in real time
- a human jumps in while the lead is still hot. the bot opens the door, the human closes it

### `assign-agent` does three jobs

- **handoff when the bot is out of its depth.** some questions are just better answered by a person. the model recognises that and passes the chat over
- **routing to the right counsellor.** each exam has its own agent. an ECAT student who lands in the MDCAT counsellor gets handed to the ECAT one. the agents pass students between each other
- **unassigning irrelevant leads to stop burning tokens.** performance campaigns pull in a lot of junk. every junk lead the bot keeps replying to costs money. when it recognises an irrelevant chat, it marks it, unassigns itself (agent id 0 = none), and goes quiet. that one change took real cost off the table

- under the hood, `assign-agent` takes a chatwoot agent id, and each id is a real human or desk. when the model calls it, chatwoot reassigns the conversation, the bot goes silent, and a person owns it from there
- this tool is the "knowing when to stop" bar in code: the bot deciding when it shouldn't be the one talking, and handing off or dropping the chat instead of pushing

### `assign-label` gives the sales team a head start

- by the time a human picks up, the chat is already tagged (intent-to-pay, affordability, free)
- the agent knows what they're walking into before they open it
- small thing, big difference to how fast the team works a queue

## the guardrail: it can't invent a price, a discount, or a validity

this is the accuracy bar, and the one with the least room for error. a wrong price or a made-up merit number destroys trust instantly with a student whose future is on the line.

- it started as a real failure. when the counsellor was just a prompt and a model, it hallucinated
- the way it hallucinated was very human: a student would express a money worry, the model would feel for them, and it would offer a product free or discounted that did not exist. empathy, but expensive

the fix was structural, not a stern instruction.

- price and product are wired to a function. any time the bot quotes a product, it can only use what `get-products` returns. there is nothing to invent from

on top of that:

- **`get-user-products` stops misselling.** before pitching, the model checks what the student already owns and how long it's valid. it can't sell a batch they already bought, and it reads validity off real data instead of guessing. this is the tool i lean on most
- **discounts are structural, not verbal.** a student can't talk the bot into a discount. promo codes only apply inside the app. the bot never honours a claimed discount or invoices a custom amount
- **a fallback price for the rare failure.** if the product fetch fails, the bot used to say "can't fetch," which dead-ends the chat. i added a hardcoded fallback price so the student still gets an answer and the chat keeps moving

- a verified-facts foundation pins the things students most often get wrong. the exam is 180 marks, full stop. it never calculates merit, it sends them to the official calculator. anything it isn't sure of, it flags as best confirmed on the official page

> [diagram or screenshot: keep the system-prompt view showing the INIT sequence and the NO FABRICATION rule]

## how the system evolved

wiring prices to a function fixed invented prices. exam facts were the other half of the accuracy bar, and getting them right pushed two bigger changes. both were about getting brittle things out of the prompt.

### moving the exam facts into a knowledge base

- early on i put everything in the system prompt: every university, paper pattern, expected merit, and date for MDCAT and ECAT
- it didn't work. the prompt got huge, and the bot still hallucinated facts out of that wall of text
- so i moved all the static exam information into a knowledge base file and turned on file search
- now the bot fact-checks what it's about to say against that file instead of carrying it in the prompt
- the prompt got lighter and the answers got more accurate at the same time

it also drew a line i now think is right:

- the prompt holds behaviour: persona, flow, rules, guardrails
- the knowledge base holds facts: dates, patterns, merits, batch details
- behaviour and facts change on different clocks, so keeping them apart means i can edit one without disturbing the other

> [diagram: your before/after split is a clean visual. one side "everything in the prompt," other side "behaviour in prompt, facts in knowledge base"]

### why the assistants platform is ours, not a vendor's

the platform i've been referencing throughout this wasn't the original plan. here's how we ended up building it.

- we started on the openai assistants playground. the interface was already built, so we just added our functions and prompt, and it let us move fast early
- then openai deprecated the assistants api (announced august 2025, shutting down august 2026) and pushed everyone to the responses api
- migrating was a real problem for us. our whole CRM was wired to typebot and chatwoot, our middleware was built around that flow, and the sales team worked inside it every day. moving would have meant re-plumbing all of it and retraining the team

so instead of migrating onto someone else's new api, i built our own in-house assistants platform.

- it kept every piece we relied on: file search, tools, instructions
- and it added the thing the playground never gave us: a different model per assistant

that model-per-assistant part is where it pays off.

- a simpler exam can run a lighter, cheaper model like haiku
- a heavy exam like MDCAT or ECAT, with all its dates and merits and nuance, runs a stronger model like sonnet or opus
- we route the model to the difficulty of the job

> [diagram or screenshot: the assistants platform, one place, a model picker per exam]

what we got out of building it:

- responses were noticeably better than the gpt-5 setup we'd had
- it came out cheaper
- and it's ours, so we can change it whenever we need to

## how i know it's working

once the build was stable, the question was whether it actually hit those three bars, across 500 conversations a day. reading them by hand doesn't scale, so the counsellor doesn't grade itself and neither do i.

the eval loop:

- chatwoot pipes each finished conversation, both sides of the transcript, into a classifier agent
- once a day the classifier reads every chat and drops it into a bucket: qualified (with a sense of how strong the intent was), ghosted, irrelevant, or future prospect
- i own the counsellor's job as one number: the share of conversations that land in qualified
- if the bot is counselling well, more students come out qualified. if that share moves, the bot's behaviour moved

> [diagram: the eval loop as a cycle. chat to classifier to bucket to qualified-rate to me reading transcripts and back. this one really wants a picture]

- that gives me a daily read on quality without reading a single transcript
- detection, then diagnosis:
  - the number tells me something slipped, not why
  - when the qualified-rate drops, i read the transcripts from that window to find the cause
  - the number is the smoke alarm, the transcripts are where i find the fire

- the full bucket taxonomy, and how these scores drive ad spend, is its own system:
  - covered in the acquisition-pipeline case study
  - here i'm using the classifier for one thing: the counsellor's report card

## where it failed and what i changed

each of these was one of the bars slipping, caught by the eval loop above: the metric flagged it, the transcript explained it.

| what broke | what i changed |
|---|---|
| gave away free and discounted products out of empathy | wired pricing to `get-products`, so it can only quote real products at real prices (the guardrail above) |
| pitched enrollment in every single message, read as pushy | rebuilt the persona into a senior counsellor who answers the real question before nudging |
| re-asked questions the student had already answered across earlier messages | made it read the full thread history first, plus a cap so it never asks the same detail twice |
| dead-ended when `get-products` failed | added a hardcoded fallback price so the chat keeps moving (the guardrail above) |

## the tradeoffs

fixing those left me with a few tensions i couldn't fully design away.

- selling too hard makes a stressed student feel sold to, so i keep pulling the bot toward helping first. still tuning it
- wiring price to a function means the bot can't bend on price, even when a human would. that's the trade, and it's why the handoff exists
- splitting behaviour and facts keeps things clean, but i have to be deliberate about what goes where
- owning the platform means owning the maintenance. when it breaks it's on us, not a vendor. worth it

## the numbers

- **qualified lead rate: 30% to 85%+.** the counsellor's report card, the share of chats the classifier scored qualified. the one i own directly
- 500+ leads a day handled
- ~95% of chats now handled by the bot, so the team qualifies less and converts more
- 24/7 coverage
- 9 tools, one counsellor pattern, across multiple exams
- cheaper than the old gpt-5 setup, with better responses

the outcome it feeds into:

- **conversion: 2% to 10%.** that's the whole acquisition system moving (ad targeting, lead scoring, and the counsellor together), not the bot alone
- the counsellor's clean contribution to it is the qualified-rate above. i'd rather own that number than claim one i share

## what i'd improve next

- **re-engagement.** a lead that goes quiet stays quiet. next is a scheduled follow-up that reaches back out within whatsapp's rules, so we don't lose the ones who just got busy or scared
- **sharper eval.** score chats against the three bars directly (empathy, accuracy, knowing when to stop), so a bad reply gets flagged on its own terms
- **test before shipping.** run each prompt change against a held-out set of past problem chats, so i can prove a fix helped instead of watching the next day's number and hoping
- **smarter routing.** get sharper about which chats actually need the heavier model, so we spend expensive tokens only where they change the answer
