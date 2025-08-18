# Code Battle

A real-time multiplayer coding platform where players compete to solve coding challenges.

## Features

- Real-time multiplayer coding environment
- Support for multiple programming languages
- Live code synchronization between players
- Automated code evaluation with test cases
- Scoring system based on test case performance
- Match-based gameplay with winners determined by scores

## Test Case System

### Overview

The platform uses a dual test case system:

1. **Visible Test Cases**: Shown to players during development to help debug their solutions
2. **Hidden Test Cases**: Only run during final submission to determine scores

### Test Case Format

Each coding challenge includes both visible and hidden test cases in the following format:

```json
{
  "id": "challenge1",
  "title": "Sum of Two Numbers",
  "description": "Given two numbers, return their sum.",
  "inputFormat": "Two integers a, b",
  "outputFormat": "An integer",
  "visibleTestCases": [
    { "input": "2 3", "expected": "5" },
    { "input": "10 -2", "expected": "8" }
  ],
  "hiddenTestCases": [
    { "input": "100 200", "expected": "300" },
    { "input": "-5 -5", "expected": "-10" }
  ]
}
```

### Scoring System

- **Run Button**: Executes code against visible test cases only
  - Awards 1 point for passing any visible test case (for development feedback)
  - No impact on final score

- **Submit Button**: Executes code against both visible and hidden test cases
  - Awards 10 points per hidden test case passed
  - These points count toward the final score

- **Match End**: The player with the highest score wins the match
  - In case of a tie, multiple winners are declared

### Implementation Details

1. **Challenge Generation**: Challenges are generated with both visible and hidden test cases
2. **Code Execution**: Uses a sandboxed environment via Piston API
3. **Result Display**: Shows detailed test case results including:
   - Input used
   - Expected output
   - Actual output
   - Pass/fail status

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# Start the backend server
cd backend
npm start

# Start the frontend development server
cd ../frontend
npm start
```

The application will be available at http://localhost:3000