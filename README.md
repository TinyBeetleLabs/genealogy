# Living Genealogy — Biblical Lineage from Adam to Jesus

An interactive, zoomable genealogy graph tracing the Messianic lineage from Adam to Jesus, built on strictly verified scripture references.

## Core Principle

**Every person and every connection in this dataset is backed by explicit scripture.**  
No invented dialogue. No speculative biography. No AI-generated expansions.  
If uncertain — omit rather than guess.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Graph visualization**: React Flow + Dagre (hierarchical layout)
- **Styling**: Tailwind CSS v4
- **Data**: Static JSON in `/data/` — curated manually against scripture

## Project Structure

```
data/
├── people.json           # All person nodes with scripture refs
├── relationships.json    # All parent→child edges with scripture refs
└── CURATION_GUIDE.md     # Rules for adding/editing data

src/
├── app/
│   ├── page.tsx          # Main graph page
│   └── api/graph/        # GET /api/graph (for Phase 2 extension)
├── components/
│   ├── graph/            # GenealogyGraph, PersonNode, GraphControls
│   ├── panel/            # PersonPanel, ScriptureRef
│   └── search/           # SearchBar
├── lib/
│   ├── data/loader.ts    # Load + validate JSON data
│   └── graph/            # transform.ts, layout.ts, query.ts
└── types/                # Person, Relationship, GraphData types
```

## Data Sources (MVP)

- Genesis 5 (Adam to Noah)
- Genesis 11:10–26 (Shem to Abraham)
- Genesis 21, 25, 29–30 (Patriarchs)
- Ruth 4:18–22 (Perez to David)
- 1 Chronicles 1–3
- Matthew 1:1–17 (Abraham to Jesus via Joseph's legal line)
- Luke 3:23–38 (corroborating references)

## Adding People or Relationships

Read `data/CURATION_GUIDE.md` before editing any data files. Every entry requires:
- At least one scripture reference proving the person exists
- At least one scripture reference proving the specific lineage connection

## Phase Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Living Genealogy Graph (Adam → Jesus) | ✅ MVP |
| 2 | Timeline + Geographic map, linked to Phase 1 data | Planned |
| 3 | "Play Mode" — scripture passage visualization | Planned |

## Building for Production

```bash
npm run build
npm run start
```

## Deploying to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Zero-config deploy — Next.js is auto-detected
