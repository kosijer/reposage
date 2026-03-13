## ADDED Requirements

### Requirement: User can paste a GitHub repository URL

The system SHALL accept a GitHub repository URL in standard formats (e.g. `https://github.com/owner/repo`, `github.com/owner/repo`) and validate that it points to a public repository.

#### Scenario: Valid URL accepted
- **WHEN** user pastes `https://github.com/vercel/next.js` and submits
- **THEN** system validates the URL format and repo existence
- **AND** triggers fetch and indexing for that repository

#### Scenario: Invalid URL rejected
- **WHEN** user pastes an invalid URL (e.g. `not-a-url`, `https://gitlab.com/owner/repo`)
- **THEN** system SHALL display a validation error
- **AND** SHALL NOT trigger fetch

#### Scenario: Non-existent repo rejected
- **WHEN** user pastes a valid GitHub URL for a repo that does not exist or is private
- **THEN** system SHALL display an error (e.g. "Repo not found or not public")
- **AND** SHALL NOT trigger fetch

### Requirement: URL input triggers repo indexing

The system SHALL trigger repo fetch and indexing when the user submits a valid GitHub repository URL.

#### Scenario: Indexing starts on submit
- **WHEN** user submits a valid public repo URL
- **THEN** system SHALL initiate fetch of README, file tree, and key config files
- **AND** SHALL show loading/feedback state until indexing completes or fails
