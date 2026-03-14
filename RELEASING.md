## Versioning & releasing

This project uses **Semantic Versioning (SemVer)** with the `version` field in
`package.json` as the **single source of truth** and **git tags** to mark
releases.

- **MAJOR** (`X.0.0`): breaking changes that may require users to update code,
  configuration, or workflows.
- **MINOR** (`x.Y.0`): new features or behavior changes that are backwards
  compatible.
- **PATCH** (`x.y.Z`): bug fixes, internal refactors, or small tweaks that do
  not change behavior from the user's perspective.

When in doubt:

- If you're between PATCH and MINOR, **bump MINOR**.
- If you're between MINOR and MAJOR, ask: “Could this break existing usage?”
  If yes or maybe, **bump MAJOR**.

The `CHANGELOG.md` file records what changed in each version and is the main
place to look when you want to understand the history of the app.

---

## Changelog structure

`CHANGELOG.md` follows a simplified
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:

- A top-level `# Changelog` heading and short description.
- An `## [Unreleased]` section that collects changes merged to `main` since the
  last tagged release.
- For each release:
  - `## [x.y.z] - YYYY-MM-DD`
  - One or more of:
    - `### Added`
    - `### Changed`
    - `### Fixed`
    - `### Removed`
    - `### Security`
  - Optional `### Notes` subsection with free-form context about the release
    (motivation, risks, migrations, caveats).

When you cut a release, **move items from `Unreleased` into a new version
section** and then reset `Unreleased` to describe only unreleased work.

---

## Commit / PR naming

Commit and PR titles don't have to be perfect, but using a light
**Conventional Commits** style makes the history and changelog easier to work
with:

- `feat: add turtle speech speed control`
- `fix: handle websocket disconnects in shell`
- `chore: update dependencies`
- `refactor: simplify audio pipeline`

These prefixes are especially helpful if you later decide to partially
automate changelog generation from git history.

---

## After-push releasing checklist

After you push significant changes to the default branch (usually `main`) and
you want to treat that state as a **release**, walk through this checklist.

1. **Review changes since the last release**
   - Look at the git log, PRs, or `CHANGELOG.md` `Unreleased` section.
   - Decide if the overall impact is:
     - only bug fixes / internal cleanups → **PATCH**
     - new features but backwards compatible → **MINOR**
     - breaking changes → **MAJOR**

2. **Choose the new version**
   - Based on step 1, pick `MAJOR.MINOR.PATCH`, using the current
     `package.json` version as the starting point.

3. **Update `package.json`**
   - Change the `version` field to the new version.
   - Example: `0.1.0` → `0.2.0` for a MINOR release.

4. **Update `CHANGELOG.md`**
   - Move entries from `## [Unreleased]` into a new version section:
     - `## [x.y.z] - YYYY-MM-DD`
   - Group bullets under `### Added`, `### Changed`, `### Fixed`, etc.
   - Add a short `### Notes` subsection with 1–3 bullets or a short paragraph
     that explains **why** this release exists and anything non-obvious.

5. **(Optional) Write extended notes**
   - In `release-notes.md` (see below), add a section for this version:
     - `## x.y.z - YYYY-MM-DD`
     - Describe motivation, risky areas, migrations, and follow-ups.
   - This file is for your own narrative; the changelog stays concise.

6. **Commit the release metadata**
   - Stage the updated `package.json`, `CHANGELOG.md`, and `release-notes.md`
     (if changed).
   - Create a commit like:
     - `chore(release): x.y.z`

7. **Tag the release**
   - Create a git tag pointing at the release commit:
     - Tag name: `vX.Y.Z` (for example, `v0.2.0`).
     - Tag message: a one- or two-line summary (you can copy from Notes).

8. **Push commit and tag**
   - Push the branch and tag to the remote:
     - `git push`
     - `git push origin vX.Y.Z`

9. **(Optional) Create a GitHub Release**
   - On GitHub (or your git hosting), create a Release:
     - Use `vX.Y.Z` as the tag.
     - Paste the corresponding `CHANGELOG.md` section and Notes.
   - Attach any build artifacts if relevant (e.g., binaries, bundles).

This checklist gives you a repeatable, low-friction path from “I pushed to
main” to “There is a well-documented release I can refer back to.”

---

## Release notes scratchpad

Use `release-notes.md` for more detailed, narrative notes that don't belong in
the main changelog. A simple structure might be:

```markdown
## 0.2.0 - 2026-03-11

- Why we cut this release now.
- Risky changes or areas to watch.
- How we validated the changes.
- Ideas and TODOs for the next release.
```

You don't have to fill this out for every version, but it's especially useful
for larger or riskier changes where context will help future you.

---

## Future automation ideas

If you want to streamline this workflow later, you can introduce light
automation without changing the core process:

- **`npm version` scripts**
  - Add scripts like:
    - `release:patch`: `npm version patch`
    - `release:minor`: `npm version minor`
    - `release:major`: `npm version major`
  - `npm version` automatically:
    - Bumps `package.json` and `package-lock.json` (if present).
    - Creates a git commit and tag.

- **Changelog generation tools**
  - Use commit messages (especially with `feat:` / `fix:` prefixes) to generate
    draft changelog entries, then edit by hand for clarity.

- **CI / GitHub Actions**
  - On a `v*` tag push:
    - Build and test the app.
    - Publish a GitHub Release that pulls in the relevant `CHANGELOG.md`
      section.
    - Optionally deploy your app to your hosting provider.

These automation layers are optional; the manual checklist above is designed to
stand on its own.

