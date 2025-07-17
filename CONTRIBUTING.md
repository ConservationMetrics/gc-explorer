# Contributor License Agreement

By submitting a pull request to this project, you agree to license your contribution under the terms of the MIT License.

Please make sure that you have the right to license the code under the MIT License and that your contributions do not infringe on the rights of others.

# Using Git

We use GitHub to host code, track issues, and accept pull requests.

## Git Branching

**We build and release from the `main` branch, so code merged here should always be stable.**

Prefer short-lived feature branches.
- Piecemeal progress towards broad code changes should merge to long-running branches until
  everything there is stable and deployable, at which point the long-running branch gets merged
  to `main`.
- Since short, coherent patches are easier to review, we code-review the individual PRs into
  the long-running feature branch (instead of review when merging the long-running branch to
  `main`)

## GitHub Issues & Labels

Create new Github Issues using the templates wherever possible.

## PR Review & Committing code

Multiple commits or PRs can be created for an Issue. e.g. each implementation step might get its own PR.

Code review is encouraged as a powerful tool for learning.  Benefits include
- Spread knowledge of the code base throughout the team: reviewing code is a remarkably effective way to learn the codebase.
- Expose everyone to different approaches.
- Ensure code is readable (and therefore maintainable).
- Yield better software (but ultimately the responsibility
  for bug-free code is on the code author, not the reviewer).

Code review is not limited to approval/rejection of PRs. Also consider involving a collaborator
earlier in the process, before the code is finished.  Ask them for a narrower review—e.g., a
design review or to focus on a specific part of the code change.

As a reviewer:
- be kind & helpful, but do not be "nice" for the sake of avoiding conflict.
- "I find this very hard to follow" is valid feedback, even if the code's behavior is technically correct.
- Ability for code review to find defects diminishes with longer PRs: Feel free to reject any
  review that adds more than 400 lines of new code. (no upper limit on deletions!)

Merging branches and PRs to `main`:
- The branch author should be the one to merge.
- Merge PRs via 'Merge Commit' option in GitHub.
- Delete a branch when you are done with it.

# Tests

## Testing Strategy

Keep the test suite
* **complete**: every feature needs a test.
* **focused**: test behavior, not implementation.
* **stable**: tests should be deterministic and fully repeatable.
* **fast**: no sleeps, no time-based tests.

## Test Frameworks

For testing Nuxt.js and Vue, use `@nuxt/test-utils` + `@vue/test-utils` with `vitest`.
See the [Nuxt documentation on testing](https://nuxt.com/docs/getting-started/testing).

For end-to-end testing, we use Playwright to test the full application in a real browser.
Playwright tests verify user interactions and page rendering with mocked API responses.

Copy `.env.test.example` to `.env.test` to configure the test environment.

# Coding & Documentation Style

## Prettier & ESLint for JavaScript, JSON, & SCSS

All developers are expected to use [prettier](https://prettier.io/) to format their JavaScript, TypeScript, Vue, JSON and SCSS
code. Currently, we use the standard Prettier [configuration](https://prettier.io/docs/en/configuration.html).

> To apply Prettier autoformatting you can configure your text editor to format on save [according
> to these docs](https://prettier.io/docs/en/editors.html)
> - For VS Code, set `editor.formatOnSave` to true in your editor config.
> or in a pre-commit hook [according to these docs](https://prettier.io/docs/en/precommit.html).

ESLint helps identify problematic patterns found in JavaScript code. The
[configuration](https://eslint.org/docs/user-guide/configuring) lives in [`eslint.config.js`](eslint.config.js)

> Follow [ESLint Getting Started](https://eslint.org/docs/user-guide/getting-started).
> To configure ESLint in VS Code, create a `.vscode/settings.json` in the project's root and add
> ```
>    "eslint.nodePath": "/home/\${user}/dev/nosh-by-gosh/client/node_modules",
>    "eslint.workingDirectories": ["client"]
> ```