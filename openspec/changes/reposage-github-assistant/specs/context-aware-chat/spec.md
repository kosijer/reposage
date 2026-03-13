## ADDED Requirements

### Requirement: Chat receives repo context

The system SHALL provide the indexed repo context (README, file tree, key config contents) to the AI model when the user sends a chat message.

#### Scenario: Context included in chat request
- **WHEN** user sends a chat message and a repo has been indexed
- **THEN** system SHALL include the indexed repo context in the request to the AI
- **AND** the AI SHALL use this context to answer questions about the repo

#### Scenario: No context when no repo indexed
- **WHEN** user sends a chat message and no repo has been indexed
- **THEN** system SHALL either prompt the user to paste a repo URL or respond that no repo context is available

### Requirement: Streaming responses

The system SHALL stream chat responses to the user word-by-word (or token-by-token) for a responsive feel.

#### Scenario: Response streams
- **WHEN** user sends a message and the AI generates a response
- **THEN** system SHALL stream the response incrementally to the client
- **AND** the UI SHALL display the response as it arrives

### Requirement: Context-aware answers

The AI SHALL produce answers that are appropriate to the type of question (e.g. architecture overview vs quickstart command vs file-purpose explanation).

#### Scenario: Architecture question
- **WHEN** user asks "What's the architecture of this project?"
- **THEN** the AI SHALL use the file tree and config files to describe structure and tech stack

#### Scenario: Quickstart question
- **WHEN** user asks "How do I run this?" or "How do I set it up?"
- **THEN** the AI SHALL use README and config files to provide setup/run instructions
