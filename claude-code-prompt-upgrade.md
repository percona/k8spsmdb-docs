# Claude Code prompt: fix Upgrade and version management section

Repo: k8spsmdb-docs, branch CLOUD-903-slava. Work in
`~/Documents/percona-repos/k8spsmdb-docs`.

This is the "Upgrade and version management" top-level nav section (11 pages:
`update.md`, `update-operator.md`, `update-crd-manual.md`, `update-crd-helm.md`,
`update-crd-olm.md`, `update-db.md`, `update-minor-set-version.md`,
`update-minor-automatic.md`, `update-major.md`, `update_manually.md`,
`update_openshift.md`). It was just reviewed with a DBA/SRE persona in mind. The
core finding: critical considerations (backup-first, version-compatibility rules,
EOL notices, known bad version combinations) are scattered across several pages
and easy to miss if a reader lands directly on a leaf procedure rather than
reading `update.md` first — which real users do on repeat visits. Two fixes were
chosen to address this (do both, they're complementary, not alternatives):

1. Turn `update.md` into a real hub page: intro + a "choose your path" decision
   table + one consolidated "Before you upgrade" reference section, matching the
   Features-overview pattern already used elsewhere in this repo (see
   `docs/backups.md` as the reference example).
2. Add a short, unmissable safety-notice snippet, included via `--8<--` at the top
   of every procedural leaf page in this section — so the warning reaches readers
   who skip `update.md` entirely, not just those who click through it.

Validate every technical claim you move or restate against `docs/operator.md`
(the CRD reference) before writing it — don't just copy prose between pages
without checking it's still accurate in the new location.

**Already applied manually — do not re-edit these beyond what's explicitly
asked below:** `docs/update-db.md` and `docs/update-minor-automatic.md` were
already revised by hand before this prompt runs.
- `update-db.md` now has its own "Choose your database upgrade path" decision
  table (covering automatic / manual-specific-version / manual-general /
  major-version / OpenShift), a trimmed explanation section, a merged
  `Never`/`Disabled` bullet, a Next steps section, and already includes
  `--8<-- "update-critical-notice.md"` after the H1 (even though that snippet
  file doesn't exist yet until Part 2 creates it).
- `update-minor-automatic.md` now has its options list reorganized into a
  collapsible reference table, the version-locked variants compressed into
  one pattern row, and the "End of Life versions of MongoDB" note moved out
  of step 3 to sit right after the intro paragraph (before the numbered
  steps), plus the step-numbering gap (3 → 5) fixed to run 1–6.

Leave both files' structure alone. The only thing either of them still needs
from this prompt is the snippet include for `update-minor-automatic.md` (Part
2) and the rename-reference fixes in Part 3, both called out below.

## Part 1 — Rebuild `docs/update.md` as the section hub

Restructure the page into, roughly, this shape (adjust as needed, but keep these
pieces):

1. **Intro** (keep close to what's there): what upgrading involves (Operator vs.
   database).

2. **"Choose your upgrade path" decision table**, replacing the current "Update
   scenarios" prose + "Choose a minor upgrade path" bullets. Model it on
   `docs/backups.md`'s decision-table style. Cover at least these axes: what you
   want to upgrade (Operator + CRD / database only), and how (automatic / manual
   / via Helm / via OLM on OpenShift). Each row should link straight to the right
   leaf page:
   - Operator + CRD, installed via `kubectl` → `update-crd-manual.md`
   - Operator + CRD, installed via Helm → `update-crd-helm.md`
   - Operator + CRD, on OpenShift via OLM → `update-crd-olm.md`
   - Database, automatic → `update-minor-automatic.md`
   - Database, manual, specific version → `update-minor-set-version.md`
   - Database, manual, general (Rolling/On Delete) → `update-manually.md` (new
     name, see Part 3)
   - Database, major version → `update-major.md`
   - Any of the above, on OpenShift → `update-openshift.md` (new name, see Part 3)

   Use your judgment on whether this is one table or two (e.g. one for "what to
   upgrade" and one for "how"); the goal is a DBA/SRE can scan it and land on
   their exact page in one step, the way `backups.md`'s table works today.

3. **New section: "## Before you upgrade: compatibility and known issues".**
   This is the consolidated reference — keep each item to 1-3 sentences with a
   link to the fuller detail that stays on its existing page (don't duplicate full
   paragraphs here, this should be scannable as a checklist, not a second copy of
   the source pages). Pull together, at minimum:

   - **Take a backup first.** State this as a universal recommendation for any
     upgrade, not only major ones — today only `update-major.md` says this
     explicitly. Link to `backup-tutorial.md` or `backups.md` as appropriate.
   - **Version jumps happen one step at a time.** Operator: only to the nearest
     `major.minor`, multiple jumps needed for bigger gaps. Database major
     versions: one major version at a time. Link to `update-operator.md`'s
     Considerations and `update-major.md` for the detail.
   - **CRD/Operator compatibility window.** The CRD supports the last 3 minor
     Operator versions. Link to `update-operator.md#considerations`.
   - **FCV changes are not easily reversible.** One-liner, link to
     `update-major.md#feature-compatibility-version`.
   - **MongoDB end-of-life notices.** MongoDB 4.4 (EOL in Operator 1.16.0) and
     5.0 (EOL in Operator 1.19.0) — summarize in one line each, link to
     `update-minor-automatic.md`'s "End of Life versions of MongoDB" note (this
     is currently buried inside the automatic-upgrade procedure page, where a
     reader planning an upgrade wouldn't necessarily look for it — surfacing it
     here is the point).
   - **Known problematic version combination.** Operator 1.19.0/1.19.1 with a
     sharded cluster and MongoDB 8.0 can fail point-in-time recovery — link to
     `update-operator.md`'s Considerations item that documents this.
   - **Test in staging first**, as a general recommendation (currently repeated
     piecemeal in `update-operator.md`'s and `update-major.md`'s intros) — state
     once here.

4. **Update strategies** section: keep as-is, this content is fine.

5. **Revision history limit** section: keep as-is.

6. **Limitations section**: remove the items that are now covered by the new
   "Before you upgrade" section above (the major-upgrade-one-at-a-time restatement
   and the `setFCV` irreversibility restatement) so they're not stated twice on
   the same page. Keep anything not already covered (e.g. the SmartUpdate-ordering
   point, if it isn't redundant with the Update strategies section above it).

7. **Next steps**: keep/update as appropriate given the new structure.

## Part 2 — Add the safety-notice snippet to every procedural page

Create `snippets/update-critical-notice.md` — short (a `!!! warning` admonition,
3-5 lines), pointing back to `update.md#before-you-upgrade-compatibility-and-known-issues`
(or whatever the actual heading/anchor ends up being after Part 1). Something like:

```
!!! warning "Before you proceed"

    Check [compatibility and known issues](update.md#before-you-upgrade-compatibility-and-known-issues)
    before upgrading — including the backup requirement, version-jump rules, and
    known problematic version combinations.
```

Add `--8<-- "update-critical-notice.md"` near the top of every procedural leaf
page in this section (after the H1, before the first content section):

- `update-operator.md`
- `update-crd-manual.md`
- `update-crd-helm.md`
- `update-crd-olm.md`
- `update-db.md` — **skip, already done** (see the note above)
- `update-minor-set-version.md` (already includes `update-assumptions.md` —
  add the new snippet include *before* it, so the safety notice is the first
  thing a reader sees)
- `update-minor-automatic.md` — still needs this: add the snippet include
  before its existing `update-assumptions.md` include. Otherwise leave this
  file exactly as already revised (see the note above) — don't touch the
  options table, the EOL note's position, or the step numbers.
- `update-major.md` (same — add before the existing `update-assumptions.md`
  include; also fine to trim `update-major.md`'s own now-redundant "make a
  backup" `!!! important` callout in favor of the shared notice, your call on
  whether keeping both is redundant or reasonably reinforces the point on the
  riskiest page)
- `update-manually.md` (new name, see Part 3)
- `update-openshift.md` (new name, see Part 3 — same, add before its existing
  `update-assumptions.md` include)

Do NOT add this to `update.md` itself — it's the source the snippet points to.

## Part 3 — Rename the two underscore files, and fix links

`update_manually.md` and `update_openshift.md` are the only two underscore-named
files in the entire docs tree (every other page uses hyphens). Rename them:

- `update_manually.md` → `update-manually.md`
- `update_openshift.md` → `update-openshift.md`

These are existing, previously-published pages (not new to this branch), so
**this rename needs a Render redirect** — the user is tracking this separately in
the project skill's redirect checklist, you don't need to do anything about Render
yourself, just do the file rename and update every reference.

Grep the whole repo for `update_manually.md`, `update_manually.html`,
`update_openshift.md`, and `update_openshift.html` and update every reference to
the new hyphenated filenames — this includes at least:
- `mkdocs-base.yml`'s nav entries
- `update.md`'s "Update on OpenShift" link and Next steps
- `update-crd-olm.md`'s "Next steps" button
- `update-db.md` (already uses the hyphenated names in its manually-added
  decision table — just double-check no stray underscore reference remains)
- any cross-links between the renamed files themselves
- report anything else found rather than assuming these are the only spots

## Part 4 — Fix the confirmed broken link

In `update-manually.md` (renamed from `update_manually.md`), the "Manual upgrade
(the On Delete strategy)" section's step 1 currently links "Operator upgrade
guide" to `update-db.md`:

```
1. Check the version of the Operator you have in your Kubernetes environment. If you need to update it, refer to the [Operator upgrade guide](update-db.md).
```

This should link to `update-operator.md`, matching the identical sentence earlier
in this same file's "Rolling Update strategy" section, and matching every sibling
page (`update-minor-set-version.md`, `update-minor-automatic.md`,
`update-major.md`) that uses this exact sentence. Fix the link target.

## Part 5 — Label the OLM path as OpenShift-only

In `update-operator.md`'s "Update guides" section, the three buttons (Manual,
Helm, OLM) are presented as equal alternatives:

```
[Update manually](update-crd-manual.md){.md-button}
[Update via Helm](update-crd-helm.md){.md-button}
[Update via OLM](update-crd-olm.md){.md-button}
```

Add a qualifier so a reader on plain Kubernetes doesn't wonder whether OLM
applies to them — e.g. change the OLM button's label to "Update via OLM
(OpenShift)" or add a short preceding note like "Running on OpenShift? Use OLM
instead." Use your judgment on the exact wording, the goal is just that it's
unambiguous before the reader clicks.

## When done

Report back: a summary of every file changed/renamed, the final heading/anchor
text for `update.md`'s new "Before you upgrade" section (so the snippet's link
target can be double-checked), the results of the repo-wide grep for the old
underscore filenames, and confirmation that every procedural page listed in Part
2 now includes the new snippet. Explicitly confirm that `update-db.md` and
`update-minor-automatic.md` were left untouched apart from the one snippet
include each was supposed to get (see the note near the top) — flag it if you
found any reason to touch more of either file. Flag anything else you found
that seems related but wasn't explicitly listed above rather than fixing it
silently.
