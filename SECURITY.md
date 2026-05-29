# Security Policy

We take the security of Aeroliths seriously. This document explains how to
report a vulnerability and what to expect once you do.

## Supported Versions

Aeroliths is continuously deployed from the `master` branch. Only the latest
version of the code (the current `master` / the live deployment) receives
security updates. There are no maintained older release branches.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or discussions.** Public disclosure before a fix is available
puts users at risk.

Instead, report vulnerabilities privately through GitHub's built-in
**private vulnerability reporting**:

1. Go to the [Security tab](https://github.com/Aeroliths/Aeroliths/security) of
   the repository.
2. Click **"Report a vulnerability"** to open a private advisory, or use this
   direct link:
   [github.com/Aeroliths/Aeroliths/security/advisories/new](https://github.com/Aeroliths/Aeroliths/security/advisories/new).
3. Fill in the details of the issue.

This keeps the report confidential between you and the maintainers until a fix
is ready.

### What to include

A good report helps us reproduce and fix the issue quickly. Where possible,
include:

- A clear description of the vulnerability and its impact.
- Steps to reproduce, or a proof of concept.
- The affected area (e.g. authentication, an API endpoint, file upload, admin
  panel).
- Any relevant logs, screenshots, or request/response details.
- Suggested remediation, if you have one.

## What to Expect

- **Acknowledgement:** we aim to acknowledge your report within a few days.
- **Updates:** we will keep you informed as we investigate and work on a fix.
- **Coordinated disclosure:** we ask that you give us a reasonable amount of
  time to release a fix before any public disclosure. We are happy to credit
  you for the discovery once the issue is resolved, unless you prefer to remain
  anonymous.

## Scope

In scope:

- The Aeroliths web application (frontend and Nitro API).
- Authentication, session handling, and access control (including the admin
  panel).
- Data handling such as file uploads and user input validation.

Out of scope:

- Vulnerabilities in third-party services or dependencies (please report those
  upstream; you may still let us know so we can update).
- Denial-of-service attacks and volumetric testing.
- Social engineering, physical attacks, and spam.

## Thank You

Responsible disclosure helps keep Aeroliths and its users safe. We appreciate
the time and effort of everyone who reports issues to us.
