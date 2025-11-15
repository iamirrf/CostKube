# Contributing to KubeCost

First off, thank you for considering contributing to KubeCost! It's people like you that make KubeCost such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to see if the problem has already been reported. If it has and the issue is still open, add a comment to the existing issue instead of opening a new one.

**When creating a bug report, please include:**

- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, Python version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- A detailed description of the proposed feature
- Explain why this enhancement would be useful
- List any examples of how it would be used

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/kubecost.git
cd kubecost/kube-cost-explorer

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest -v
```

## Coding Standards

### Python Code

- Follow PEP 8 style guide
- Use type hints where applicable
- Write docstrings for all functions and classes
- Keep functions small and focused
- Use meaningful variable names

### Frontend Code

- Follow modern JavaScript best practices
- Maintain consistency with Red Hat design system
- Keep CSS organized and well-commented
- Ensure responsive design

### Testing

- Write unit tests for new features
- Maintain or improve code coverage
- Test both success and failure cases
- Use descriptive test names

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

**Examples:**

```
Add namespace filtering feature

- Implement filter dropdown in UI
- Add API endpoint for filtering
- Update tests

Fixes #123
```

## Project Structure

```
kube-cost-explorer/
├── app/              # Application code
│   ├── api/         # API routes
│   ├── services/    # Business logic
│   └── ui/          # Frontend assets
├── config/          # Configuration files
├── tests/           # Test suite
└── sample_data/     # Demo data
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

## Recognition

Contributors will be recognized in our README and release notes. Thank you for your contributions!
