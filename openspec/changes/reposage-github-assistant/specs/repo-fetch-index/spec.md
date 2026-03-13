## ADDED Requirements

### Requirement: Fetch README from public GitHub repo

The system SHALL fetch the README file (README.md, README, or common variants) from the repository root when indexing a public GitHub repo.

#### Scenario: README fetched successfully
- **WHEN** indexing is triggered for a repo that has a README
- **THEN** system SHALL retrieve the README content
- **AND** SHALL include it in the indexed context for the AI

#### Scenario: No README
- **WHEN** indexing is triggered for a repo without a README
- **THEN** system SHALL proceed with other indexed content
- **AND** SHALL not fail indexing

### Requirement: Fetch file tree from repository

The system SHALL fetch the top-level file and directory structure (file tree) of the repository.

#### Scenario: File tree retrieved
- **WHEN** indexing is triggered
- **THEN** system SHALL retrieve the list of files and directories at repo root
- **AND** SHALL include this structure in the indexed context

### Requirement: Fetch key config files

The system SHALL fetch a defined set of key config files from the repo root when present (e.g. package.json, Cargo.toml, pyproject.toml, go.mod, requirements.txt, Gemfile, docker-compose.yml, Makefile, .env.example).

#### Scenario: Key config files fetched
- **WHEN** indexing is triggered and key config files exist at repo root
- **THEN** system SHALL fetch the content of each present key config file
- **AND** SHALL include their contents in the indexed context (up to a reasonable limit)

#### Scenario: No key configs present
- **WHEN** indexing is triggered and no key config files exist
- **THEN** system SHALL proceed with README and file tree only

### Requirement: No authentication required

The system SHALL fetch repository data using only public, unauthenticated access (no GitHub token or OAuth).

#### Scenario: Public repo accessible without auth
- **WHEN** user requests indexing for a public repo
- **THEN** system SHALL succeed without any GitHub credentials
