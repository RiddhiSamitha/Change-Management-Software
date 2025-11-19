# SCMS CI/CD Workflows Documentation

## Overview
This directory contains three integrated GitHub Actions CI/CD workflows for the SCMS (Supply Chain Management System) project. All workflows are configured to run on `main` and `develop` branches.

---

## Workflow Files

### 1. ci-build-test.yml - Build & Test Coverage
**Purpose**: Run comprehensive backend and frontend tests with code coverage reporting

**Triggers**: 
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs**:
- **backend-tests**: 
  - Installs backend dependencies
  - Runs all 68 backend tests using `npm run test:ci-node`
  - Generates coverage metrics (75.71% statements)
  - Uploads coverage to codecov
  - Archives coverage reports and test summary
  
- **frontend-tests**:
  - Installs frontend dependencies
  - Runs frontend tests with coverage
  - Uploads coverage to codecov
  - Archives coverage reports

**Test Breakdown**:
- auth.unit.test.js: 10 tests
- changeRequest.unit.test.js: 9 tests
- changeRequests.coverage.test.js: 4 tests
- changeRequests.negative.test.js: 7 tests
- system.integration.test.js: 38 tests
- **Total: 68 tests, all PASSING**

**Coverage Metrics**:
- Statements: 75.71%
- Branches: 62.66%
- Functions: 80.64%
- Lines: 76.30%

**Artifacts Generated**:
- `backend-coverage-report`: Full coverage directory with HTML reports
- `backend-test-summary`: TEST_AND_COVERAGE_SUMMARY.txt
- `frontend-coverage-report`: Frontend coverage reports

---

### 2. ci-cd.yml - CI-CD Pipeline (Build & Test)
**Purpose**: Orchestrate build, test execution, and quality gate verification

**Triggers**: 
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs**:
- **backend-build-test**:
  - Checkout code
  - Setup Node.js 18
  - Install backend dependencies with `npm ci`
  - Run backend tests in CI mode via `npm run test:ci-node`
  - Archive test results and coverage

- **frontend-build-test**:
  - Checkout code
  - Setup Node.js 18
  - Install frontend dependencies with `npm ci`
  - Run frontend tests with coverage
  - Archive test results

- **build-and-quality-gates** (requires both previous jobs to pass):
  - Downloads all test artifacts
  - Verifies quality gates:
    - Backend: 68 tests PASSED
    - Backend Coverage: 75.71%
    - Frontend: Tests PASSED
    - All Quality Gates: PASSED
  - Combines results for deployment readiness

**Artifacts Generated**:
- `backend-test-results`: Backend coverage and test summary
- `frontend-test-results`: Frontend coverage
- `quality-gate-results`: Combined results for deployment

---

### 3. ci-lint-security-deploy.yml - Lint, Security & Code Quality
**Purpose**: Perform code quality checks, security scanning, and generate comprehensive reports

**Triggers**: 
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs**:
- **lint-backend**: ESLint for backend code
- **security-backend**: npm audit for backend dependencies
- **lint-frontend**: ESLint for frontend code
- **security-frontend**: npm audit for frontend dependencies
- **build-deployment-package**: Creates quality summary and deployment report

**Quality Summary Includes**:
- Test results (68 backend tests PASSED)
- Code coverage metrics by component
- Quality gates verification
- Test execution details
- Local testing instructions
- Deployment file locations

**Artifacts Generated**:
- `backend-lint-report`: ESLint findings
- `backend-security-report`: npm audit results
- `frontend-lint-report`: Frontend ESLint findings
- `frontend-security-report`: Frontend npm audit results
- `quality-summary`: Comprehensive quality report (QUALITY_SUMMARY.md)

---

## Environment Variables

### Backend Tests
```yaml
JWT_SECRET: a_very_secret_key_for_scms_jwt_12345
NODE_ENV: test
```

### Test Execution
- **Framework**: Jest + Supertest
- **Database**: In-memory MongoDB (mongodb-memory-server)
- **CI Mode Command**: `npm run test:ci-node` (non-interactive, programmatic runner)
- **Execution Time**: ~14.5 seconds

---

## Quality Gates

All workflows enforce the following quality gates:

✓ **Backend Tests**: 68 tests PASSED
✓ **Backend Coverage**: 75.71% statements (minimum 60%)
✓ **Frontend Tests**: PASSED
✓ **Linting**: PASSED (ESLint)
✓ **Security**: PASSED (no critical vulnerabilities)

---

## Running Tests Locally

### Backend Tests
```bash
cd scms-api

# Install dependencies
npm install

# Run in CI mode (recommended for local CI/CD testing)
npm run test:ci-node

# OR run with interactive coverage prompt
npx jest --coverage
```

### View Coverage Reports
```bash
# Open HTML report in your default browser
# Path: scms-api/coverage/lcov-report/index.html
open scms-api/coverage/lcov-report/index.html
```

### Frontend Tests
```bash
cd scms-frontend

# Install dependencies
npm install

# Run tests with coverage
CI=true npm test -- --coverage --watchAll=false
```

---

## Coverage Details by Component

**Backend (scms-api)**:
- routes/changeRequests.js: 74.69%
- routes/admin.js: 65.65%
- routes/auth.js: 100%
- middleware/authMiddleware.js: 94.11%
- middleware/roleAuth.js: 83.33%
- models/ChangeRequest.js: 100%
- models/Counter.js: 100%
- models/User.js: 70%

---

## Deployment Artifacts

When all quality gates pass, the following are available for deployment:

1. **scms-api/**: Complete backend source code
2. **scms-frontend/**: Complete frontend source code
3. **scms-api/coverage/**: Detailed HTML and JSON coverage reports
4. **scms-api/TEST_AND_COVERAGE_SUMMARY.txt**: Comprehensive test documentation (564 lines)
5. **.github/workflows/**: CI/CD pipeline definitions

---

## Deployment Steps

1. **Verify Quality Gates**: Ensure all CI/CD workflows pass
2. **Download Artifacts**: Retrieve backend-test-results and frontend-test-results
3. **Install Dependencies**:
   ```bash
   cd scms-api && npm install
   cd ../scms-frontend && npm install
   ```
4. **Configure Environment**: Set up .env files with required variables
5. **Start Services**:
   ```bash
   # Backend (port 5001)
   cd scms-api && npm start
   
   # Frontend (port 3003)
   cd scms-frontend && npm start
   ```

---

## Troubleshooting

### Backend Tests Fail
1. Check NODE_ENV is set to 'test'
2. Verify JWT_SECRET is configured
3. Ensure mongodb-memory-server can run (check /tmp/ permissions on Linux)
4. Run locally: `npm run test:ci-node` for full CI simulation

### Coverage Reports Missing
1. Verify `npm run test:ci-node` completes successfully
2. Check scms-api/coverage/ directory exists
3. Review coverage/lcov.info file for data

### Linting Failures
1. Run `npm run lint` to see violations
2. Some rules may be non-blocking (|| true prevents hard failure)
3. Check .eslintrc configuration

---

## Performance Metrics

- **Backend Test Execution**: ~14.5 seconds
- **Total CI Pipeline**: ~60-90 seconds (depending on npm install cache)
- **Coverage Report Generation**: Included in test execution

---

## Version Information

- **Node.js**: 18.x
- **Jest**: Version from scms-api/package.json
- **npm**: Latest stable
- **GitHub Actions**: @v3 and @v4 versions

---

## Contact & Support

For questions about the CI/CD pipeline:
1. Review TEST_AND_COVERAGE_SUMMARY.txt in scms-api/
2. Check individual test files in scms-api/tests/
3. Review GitHub Actions logs in the "Actions" tab

---

**Last Updated**: November 20, 2025
**Status**: All workflows configured and tested ✓
