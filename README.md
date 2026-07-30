# dania siddiqui — portfolio

My personal site: [daniasiddiqui.vercel.app](https://daniasiddiqui.vercel.app)

An envelope you scroll open — a note and photo slide out of the pocket, then
folds for what I've built, a bit about me, and how to reach me. Built as one
long scroll-driven page rather than a stack of static sections.

## Stack

- [Next.js](https://nextjs.org) (App Router, Turbopack) + [React](https://react.dev) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Framer Motion](https://www.framer.com/motion/) for the scroll choreography (the envelope opening, card reveals, page transitions)
- `react-markdown` for the case-study write-ups

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The page auto-updates as
you edit files under `app/` and `components/`.

## Deploying

Deployed on [Vercel](https://vercel.com); pushes to `main` deploy automatically.
