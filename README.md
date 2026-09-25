# KFS Validator

Browser-only runtime demo for generating and previewing fictional Demo Bank Key Fact Statements across 16 Indian languages.

## Features

- Demo Personal Loan and Demo Flexi Loan flows
- Right-to-left rendering for Urdu and Kashmiri
- PDF, HTML, and JSON downloads
- EMI, APR, interest, and repayment schedule calculations
- No project backend or server-side runtime

The public repository contains only the publishable runtime. Reference PDFs, source fixtures, build tooling, and review artifacts are kept outside the repository.

## Run locally

Open index.html directly, or serve this directory with a local static server:

    python3 -m http.server 8080

## GitHub Pages

The main branch is deployed at [https://rahulm38.github.io/KFSvalidation/](https://rahulm38.github.io/KFSvalidation/). Push to main to deploy.

## Demo data and privacy

The included statement payload is fictional sample content. Use synthetic values only; do not enter or publish personal, customer, account, transaction, financial, or production data. Inputs and calculations run in the browser; the app has no project backend. The page requests the Inter font from Google Fonts. GitHub Pages logs visitor IP addresses for security. See [PRIVACY.md](PRIVACY.md).

## License and third-party material

The [MIT license](LICENSE) applies only to original source code and documentation listed in [LICENSE_SCOPE.md](LICENSE_SCOPE.md). The demo statement payload and third-party materials are excluded. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).