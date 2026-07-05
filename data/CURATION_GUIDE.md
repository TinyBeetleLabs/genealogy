# Data Curation Guide

## Core Principle

**Every claim in this dataset must be directly supported by scripture.**  
If uncertain: **omit rather than guess.**

---

## Rules for Every Person Entry

### Required Fields
- `id` — lowercase, hyphenated slug (e.g. `"joseph-husband-mary"`)
- `name` — the most common English biblical name
- `scriptureRefs.existence` — at least one verse proving this person is named in scripture

### Optional Fields (only include if clearly supported)
- `alternateNames` — only if scripture explicitly uses another name for the same person (e.g. Abram → Abraham, Jacob → Israel)
- `gender` — only record what scripture indicates
- `description` — **maximum 2 sentences**. Must be verifiable. Do not add theology, interpretation, or inference. If the only thing scripture says is their name and lineage, leave this blank.
- `scriptureRefs.lineage` — references proving a specific parent→child relationship. Required for every non-root person.

### Forbidden
- Invented biographical detail
- Ages, dates, or numbers not in scripture
- Harmonization of conflicting genealogies (note the conflict instead)
- Theological conclusions (e.g. "he was faithful")
- Events not recorded in the cited text
- Any content derived from extra-biblical sources (Josephus, rabbinic tradition, etc.) unless labeled as such

---

## Rules for Every Relationship Entry

- `source` must be the **parent** (or ancestor) person ID
- `target` must be the **child** (or descendant) person ID
- `type`:
  - `"biological"` — both parent and child acknowledged in text
  - `"legal"` — legal or adoptive relationship explicitly noted (e.g. Joseph and Jesus)
  - `"adoptive"` — only if scripture explicitly indicates adoption
- `scriptureRefs` — at least one verse proving **this specific connection** (not just that both people exist)
- `notes` — use only to explain ambiguity (e.g. "Matthew lists this lineage through Joseph; Luke's list diverges at this generation")

---

## Handling Textual Variations

### Matthew 1 vs. Luke 3
These two genealogies diverge significantly between David and Joseph. Common scholarly positions:
- Matthew traces Joseph's legal line
- Luke traces Mary's biological line (per some traditions) or another legal line

**Our approach:** Include both lists with clear labeling. Do not merge or collapse them. Flag divergence in `notes`.

### Name Transliterations
Hebrew names have many English spellings. Use the most common English Bible rendering. Record variants in `alternateNames` only if a different name appears in a different book of scripture.

---

## Sources Used for MVP Data
Primary sources (chapter and verse verified in each entry):
- Genesis 5 (Adamic genealogy)
- Genesis 11:10–26 (Shem to Terah)
- Genesis 25 (Isaac → Jacob)
- Genesis 29–30, 35 (Jacob's sons)
- Ruth 4:18–22 (Perez to David)
- 1 Chronicles 1–3 (parallel genealogy records)
- Matthew 1:1–17 (Abraham to Jesus via Joseph)
- Luke 3:23–38 (Jesus to Adam via different line)

---

## Verification Checklist (per entry)

- [ ] Name matches the scripture text in at least one cited verse
- [ ] `existence` refs actually name this person (not just imply them)
- [ ] `lineage` refs explicitly state the parent→child connection
- [ ] Description (if any) contains nothing that cannot be verified in the cited verses
- [ ] No theological editorializing

---

## Adding New Entries

1. Open the relevant chapter(s) in a Bible text
2. Write down the exact verse(s) that support each claim
3. Add the entry with only what the verse(s) directly state
4. Peer-review against the checklist above before committing
