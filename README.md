# KFS Validator

A static web app for generating, previewing, and validating **HDFC Bank Key Fact Statements (KFS)** across **16 Indian languages**.

## Features

- ✅ Insta Loan & Insta Jumbo Loan flows
- ✅ 16 languages (English, Hindi, Urdu, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Manipuri, Konkani, Kashmiri)
- ✅ RTL rendering for Urdu & Kashmiri (`dir="rtl"` injected automatically)
- ✅ Download as **PDF** (browser print), **HTML**, or **JSON**
- ✅ Live repayment schedule with EMI, APR, and total interest
- ✅ Fully static — no backend required

## Project Structure

```
KFSviewer/
├── index.html           # App shell (HTML + layout)
├── styles.css           # All styling
├── js/
│   ├── calc.js          # Pure financial calculations (pmt, IRR, schedule)
│   ├── loader.js        # Payload decompression & global init
│   └── app.js           # UI wiring, generate, download handlers
├── kfs_jsons/           # 16 language JSON copy files (canonical source)
│   ├── english.json
│   ├── hindi.json
│   ├── urdu.json
│   └── ... (16 files total)
├── data/
│   └── kfs-payload.js   # Compiled, gzip-compressed payload (auto-generated)
└── scripts/
    └── build_payload.py # Compiles kfs_jsons/ + template → data/kfs-payload.js
```

## Development

### Rebuild the Payload

Any time you edit a JSON in `kfs_jsons/`, rebuild the payload:

```bash
python3 scripts/build_payload.py
```

This reads `kfs_jsons/*.json` + `scratch/template.html` → writes `data/kfs-payload.js`.

### Edit Language Copy

Language strings live in `kfs_jsons/<language>.json`.  
Each file has **168 keys** mapping to display text.

RTL languages (Urdu, Kashmiri) must have properly encoded Unicode strings — **not** reversed/mirrored text.

### Run Locally

Simply open `index.html` in a browser (no build step needed):

```bash
open index.html
```

Or serve with a local server to avoid CORS issues:

```bash
python3 -m http.server 8080
```

## GitHub Pages

The `main` branch is deployed at:  
👉 `https://rahulm38.github.io/KFSvalidation/`

Push to `main` to deploy.
