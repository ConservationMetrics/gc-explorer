# Contributing Guidelines

This repository uses the same contributing guidelines defined in `ConservationMetrics/gc-scripts-hub`:
- [`ConservationMetrics/gc-scripts-hub/CONTRIBUTING.md`](https://github.com/ConservationMetrics/gc-scripts-hub/blob/main/CONTRIBUTING.md)
- [`ConservationMetrics/gc-scripts-hub/CONTRIBUTING_EXAMPLES.md`](https://github.com/ConservationMetrics/gc-scripts-hub/blob/main/CONTRIBUTING_EXAMPLES.md)
- [`ConservationMetrics/gc-scripts-hub/CONTRIBUTING_LLM_GUIDELINES.md`](https://github.com/ConservationMetrics/gc-scripts-hub/blob/main/CONTRIBUTING_LLM_GUIDELINES.md)

Please review those before submitting pull requests or issues.

Any additional or overriding rules specific to this repository are listed below.


# Contributor License Agreement

By submitting a pull request to this project, you agree to license your contribution under the terms of the [MIT License](/LICENSE).  Make sure that you have the right to license the code under the MIT License and that your contributions do not infringe on the rights of others.


# Test Frameworks

For testing Nuxt.js and Vue, use `@nuxt/test-utils` + `@vue/test-utils` with `vitest`.
See the [Nuxt documentation on testing](https://nuxt.com/docs/getting-started/testing).

For end-to-end testing, we use Playwright to test the full application in a real browser.
Playwright tests verify user interactions and page rendering with mocked API responses.

See the [README](README.md#testing) for more details on testing.
