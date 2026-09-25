# KFS Validator

Browser-only runtime bundle for generating and previewing Demo Bank Key Fact
Statements across 16 Indian languages.

## Runtime

- Demo Personal Loan and Demo Flexi Loan flows
- RTL rendering for Urdu and Kashmiri
- PDF, HTML, and JSON downloads
- EMI, APR, interest, and repayment schedule calculation
- No backend or server-side runtime

This public repository intentionally contains only the publishable runtime.
Reference PDFs, source fixtures, build tooling, and review artifacts are kept
outside the public repository.

### Run Locally

Simply open `index.html` in a browser (no build step needed):

```bash
open index.html
```

Or serve with a local server to avoid CORS issues:

```bash
python3 -m http.server 8080
```

## Run locally

Open `index.html` directly, or serve this directory with any static web server.

## GitHub Pages

The `main` branch is deployed at:
`https://rahulm38.github.io/KFSvalidation/`

Push to `main` to deploy.
