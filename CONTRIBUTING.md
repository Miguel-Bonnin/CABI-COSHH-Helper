# Contributing to CABI COSHH Helper

Welcome! We're excited that you want to contribute to making this COSHH assessment tool more reliable and maintainable. This guide will help you get started with development, testing, and submitting changes.

## Prerequisites

To work on this project, you'll need:

- **Modern web browser** (Chrome, Firefox, Edge, or Safari)
- **Text editor or IDE** (VS Code, Sublime Text, Notepad++, or any editor you prefer)
- **Node.js** (optional, but recommended for running tests) - [Download here](https://nodejs.org/)
- **Git** (for version control) - [Download here](https://git-scm.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Miguel-Bonnin/CABI-COSHH-Helper.git
cd CABI-COSHH-Helper
```

### 2. Install Dependencies (Optional)

If you want to run the test suite (highly recommended!), install Node.js dependencies:

```bash
npm install
```

This installs Vitest and happy-dom for testing. Testing infrastructure was added in Phase 1 (January 2026) to ensure the application remains stable as we add features.

### 3. Run the Application Locally

Since this is a client-side web application, you can run it with any local HTTP server. Here are a few options:

**Option A: Python (if installed)**
```bash
python -m http.server 8000
```
Then open http://localhost:8000/coshhgeneratorv5.html in your browser.

**Option B: VS Code Live Server Extension**
- Install the "Live Server" extension
- Right-click on `coshhgeneratorv5.html` and select "Open with Live Server"

**Option C: Node.js http-server (if you have npm)**
```bash
npx http-server -p 8000
```
Then open http://localhost:8000/coshhgeneratorv5.html in your browser.

## Running Tests

Testing is a core part of this project's maintainability strategy. We use Vitest with happy-dom for fast, reliable unit tests.

### Run All Tests

```bash
npm test
```

This runs all tests in the `tests/` directory and shows you which tests pass or fail.

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

Tests will automatically re-run when you save changes to files.

### Run Tests with UI

```bash
npm run test:ui
```

Opens an interactive UI in your browser where you can see test results, filter tests, and debug failures.

### Understanding Test Output

When you run tests, you'll see output like this:

```
✓ tests/riskCalculators.test.js (15 tests) 823ms
✓ tests/domHelpers.test.js (27 tests) 145ms
✓ tests/validation.test.js (18 tests) 92ms

Test Files  3 passed (3)
     Tests  60 passed (60)
```

If a test fails, you'll see a detailed error message showing what went wrong and which assertion failed.

## Project Structure

The codebase is organized into several key directories:

- **`coshhgeneratorv5.html`** - Main application file (entry point)
- **`js/`** - JavaScript modules
  - `js/config/` - Configuration data (procedures, hazards, controls)
  - `js/modules/` - Extracted utility modules (risk calculators, DOM helpers)
  - `js/*.js` - Feature modules (inventory manager, floor plan viewer, EH40 loader)
- **`css/`** - Modularized stylesheets
- **`tests/`** - Test files (`.test.js` extension)
- **`data/`** - Static data files (inventory, tracking, WEL limits)
- **`examples/`** - Example MSDS and assessment files

For a detailed breakdown of the codebase structure, see `.planning/codebase/STRUCTURE.md`.

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b my-feature-name
```

Use descriptive branch names like `fix-severity-calculation` or `add-export-feature`.

### 2. Make Your Changes

Edit the relevant files using your preferred editor. Focus on small, focused changes rather than large sweeping modifications.

### 3. Run Tests

Before committing, make sure all tests pass:

```bash
npm test
```

If you added new functionality, consider adding tests for it (see Testing Guidelines below).

### 4. Commit Your Changes

Follow our commit message conventions (see next section). Commit early and often with clear, descriptive messages.

```bash
git add .
git commit -m "type(scope): description"
```

### 5. Push and Create a Pull Request

```bash
git push origin my-feature-name
```

Then create a pull request on GitHub with a clear description of your changes.

## Commit Message Format

We use a structured commit format to keep the project history clean and understandable:

```
type(scope): description

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Commit Types

- **feat** - A new feature
- **fix** - A bug fix
- **test** - Adding or updating tests
- **refactor** - Code changes that neither fix bugs nor add features
- **docs** - Documentation changes
- **style** - Code style changes (formatting, whitespace, etc.)

### Commit Scopes

**For GSD (Get Shit Done) workflow commits:**
Use the phase-plan format (e.g., `01-02`, `02-03`):

```
feat(02-02): add retry logic to data loaders
test(01-02): add failing test for severity calculation
refactor(02-03): use safe DOM helpers throughout codebase
```

**For feature work:**
Use the component or feature name:

```
feat(inventory): add filtering by location
fix(parser): handle missing GHS pictograms
test(calculator): add edge case tests for zero values
```

### Real Examples from This Project

```
feat(02-02): add user error messages and recovery UI
feat(02-03): create safe DOM query helper module
refactor(02-03): use safe DOM helpers throughout codebase
test(01-02): add failing test for severity calculation
docs(03): create phase plan for Documentation Excellence
```

### Co-Authored-By Trailer

If you're working with Claude Code, include the Co-Authored-By trailer as shown above. This helps track AI-assisted development.

## Testing Guidelines

Testing is essential to this project's reliability. Here's what we expect:

### 1. All New Functions Should Have Tests

Especially focus on:
- **Calculations** (severity, likelihood, risk scores)
- **Validation logic** (input checks, range validation)
- **Data transformations** (parsing, formatting)

### 2. Tests Live in the `tests/` Directory

Create test files with the `.test.js` extension:

```
tests/
  riskCalculators.test.js
  domHelpers.test.js
  validation.test.js
```

### 3. Use Descriptive Test Names

Good test names explain what should happen:

```javascript
// Good
test('should reject negative severity values', () => { ... });
test('should calculate correct risk level for high severity and medium likelihood', () => { ... });
test('should return null when element does not exist', () => { ... });

// Avoid
test('test1', () => { ... });
test('severity test', () => { ... });
```

### 4. Follow RED-GREEN-REFACTOR for Business Logic

This TDD workflow helps ensure your code is correct:

1. **RED**: Write a failing test that describes the desired behavior
2. **GREEN**: Write the minimum code to make the test pass
3. **REFACTOR**: Clean up the code while keeping tests passing

This approach is especially valuable for calculation and validation logic.

### 5. Run Tests Before Committing

Always run `npm test` before creating a commit. This catches issues early and prevents breaking changes from entering the codebase.

### Note on UI Testing

UI functions that manipulate the DOM can be harder to test. Focus on extracting pure functions that can be tested independently. For example, `domHelpers.js` provides testable helper functions that wrap DOM operations.

**Example: Extracting Testable Code**

Instead of:
```javascript
function updateDisplay() {
    const element = document.getElementById('myElement');
    element.textContent = calculateValue();
}
```

Extract the calculation:
```javascript
// Testable pure function
export function calculateValue() {
    return /* calculation logic */;
}

// UI function that uses it
function updateDisplay() {
    const element = document.getElementById('myElement');
    element.textContent = calculateValue();
}
```

Now you can test `calculateValue()` without needing DOM setup.

## Questions?

If you have questions or run into issues:

1. Check the documentation in `.planning/codebase/` for codebase details
2. Review `TECHNICAL.md` for technical implementation details
3. Look at existing tests for examples of testing patterns
4. Open an issue on GitHub to discuss your question

## Thank You!

Your contributions help make this tool more reliable and maintainable. Every test written, bug fixed, and feature improved brings us closer to the goal of demonstrating professional quality that earns IT department support for backend integration.

Happy coding!
