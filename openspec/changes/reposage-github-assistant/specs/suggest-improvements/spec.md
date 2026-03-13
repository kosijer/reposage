## ADDED Requirements

### Requirement: One-click suggest improvements

The system SHALL provide a single action (e.g. button or prompt) that triggers an analysis of the indexed repo and returns concrete suggestions for improvements, missing docs, or potential issues.

#### Scenario: User triggers suggest improvements
- **WHEN** user clicks "Suggest improvements" (or equivalent) and a repo has been indexed
- **THEN** system SHALL run an analysis using the full repo context
- **AND** SHALL return a structured response with actionable suggestions

#### Scenario: Suggestions include categories
- **WHEN** analysis completes
- **THEN** the response SHALL include suggestions in categories such as: missing documentation, potential issues, next steps, or similar
- **AND** each suggestion SHALL be concrete and actionable where possible

#### Scenario: No repo indexed
- **WHEN** user clicks "Suggest improvements" and no repo has been indexed
- **THEN** system SHALL prompt the user to paste a GitHub URL first
- **AND** SHALL NOT run analysis
