#!/bin/bash

# Test static build locally before GitHub Pages deployment
# This script serves the static files from the 'out' directory and runs Playwright tests

set -e

echo "🧪 Starting local server for static build testing..."

# Install http-server if not available
if ! command -v http-server &> /dev/null; then
  npm install -g http-server
fi

# Start server in background
cd out
http-server -p 8080 --cors &
SERVER_PID=$!

cd ..

# Wait for server to start
sleep 2

echo "✅ Server started on http://localhost:8080"
echo "🎯 Running Playwright tests against static build..."

# Run Playwright tests with custom base URL
PLAYWRIGHT_TEST_BASE_URL="http://localhost:8080" npx playwright test tests/e2e-github-pages.spec.ts --project=chromium

TEST_RESULT=$?

# Kill the server
kill $SERVER_PID 2>/dev/null || true

if [ $TEST_RESULT -eq 0 ]; then
  echo "✅ All tests passed!"
  echo "🚀 Ready for GitHub Pages deployment"
else
  echo "❌ Some tests failed. Review the HTML report:"
  echo "  npx playwright show-report"
  exit 1
fi
