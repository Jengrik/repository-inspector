# Repository Inspector

The **Repository Inspector** is a command-line tool implemented in **Node.js (≥20) and TypeScript** that analyzes the structure and contents of a target repository, producing a deterministic set of Markdown artifacts for documentation and auditing purposes.

Its primary objective is to provide **transparent, reproducible, and secure repository inspection** by applying consistent classification and filtering rules. The tool is designed following **Hexagonal Architecture (Ports & Adapters)**, ensuring a clear separation between domain logic and infrastructure details.

## Features

- **Automated Repository Scanning**: Traverses repositories via filesystem walk (default) or Git-tracked mode.
- **Deterministic Outputs**:
  - `REPO-CODE.md`: Contains normalized, text-based source and documentation files.
  - `REPO-CONFIG.md`: Contains configuration and metadata files, with optional secret redaction.
  - `REPO-TREE.md`: Contains a names-only directory tree, unlimited depth by default.
- **Filtering and Policies**:
  - Excludes binary files and files >200 KB (configurable).
  - Skips transient and build directories (e.g., `.git`, `node_modules`, `dist`).
  - Normalizes line endings (CRLF → LF) to ensure Markdown integrity.
- **Secret Redaction (Opt-in)**: Conservative redaction of sensitive keys in configuration files, disabled by default.
- **Deterministic Ordering**: Stable path sorting and anchor generation for reproducible runs.
- **Performance & Resource Safety**: Streaming writes, bounded concurrency, and atomic file generation to ensure reliability on large repositories.

## Non-Functional Characteristics

- **Cross-platform compatibility**: macOS, Linux, and Windows.
- **Strict TypeScript typing**: Domain model enforces explicit contracts for classification, redaction, and path normalization.
- **Clean Code Compliance**: Readable, testable, and maintainable design with clear separation of concerns.
- **Testing Strategy**: Comprehensive suite including unit, integration, snapshot, and performance tests with ≥80% coverage in critical paths.
- **Logging and Metrics**: Structured logs with counts, omissions, errors, and runtime summary.

## Architectural Overview

The tool employs **Hexagonal Architecture** to maximize testability, extensibility, and maintainability.  
- **Domain Core**: Encapsulates classification and redaction policies.  
- **Inbound Adapter**: CLI for argument parsing and orchestration.  
- **Outbound Adapters**: Filesystem/Git discovery, Markdown emission, redaction, logging.  

This design ensures that the domain is isolated from I/O details and external dependencies, promoting robustness and long-term sustainability.

## Installation

```bash
git clone <your-repo-url>
cd repository-inspector
npm install
```

## Usage

Run the CLI to generate Markdown artifacts from a repository:

```bash
npm run build
node dist/index.js generate --repo <path-to-repo> --out <output-dir>
```

Optional flags:
- `--respect-gitignore`
- `--tracked-only`
- `--max-bytes <number>`
- `--depth <number>`
- `--redact-secrets`

## License

This project is provided under the MIT License.
