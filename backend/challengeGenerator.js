const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
require('dotenv').config();

// Initialize the OpenAI model
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  modelName: 'gpt-3.5-turbo',
});

// Define the prompt template for generating coding challenges
const challengePromptTemplate = PromptTemplate.fromTemplate(`
You are a coding challenge generator for a competitive programming platform.
Generate a unique coding challenge with the following structure:

1. Title: A concise title for the challenge
2. Description: A clear explanation of the problem
3. Constraints: Any constraints on input/output or performance requirements
4. Visible Test Cases: 2-3 test cases that will be shown to the user (format: input and expected output pairs)
5. Hidden Test Cases: 2-3 additional test cases that will be used for scoring but not shown to the user
6. Difficulty: Easy, Medium, or Hard

The challenge should be appropriate for a {difficulty} difficulty level and solvable in {language}.
Make sure the challenge is clear, concise, and has a well-defined solution.
For test cases, provide input and expected output pairs that thoroughly test the solution.
`);

// Function to generate a coding challenge
async function generateChallenge(language = 'javascript', difficulty = 'medium') {
  try {
    // Create the chain
    const chain = challengePromptTemplate
      .pipe(chatModel)
      .pipe(new StringOutputParser());

    // Generate the challenge
    const challenge = await chain.invoke({
      language,
      difficulty,
    });

    // Parse the challenge into a structured format
    const parsedChallenge = parseChallenge(challenge);
    return parsedChallenge;
  } catch (error) {
    console.error('Error generating challenge:', error);
    return {
      title: 'Reverse a String',
      description: 'Write a function that reverses a string. The input string is given as an array of characters.',
      constraints: 'Do not allocate extra space for another array. You must do this by modifying the input array in-place with O(1) extra memory.',
      visibleTestCases: [
        { input: '"hello"', expected: '"olleh"' },
        { input: '"world"', expected: '"dlrow"' }
      ],
      hiddenTestCases: [
        { input: '"javascript"', expected: '"tpircsavaj"' },
        { input: '"algorithm"', expected: '"mhtirogla"' }
      ],
      difficulty: 'Easy',
      exampleInput: '"hello"',
      exampleOutput: '"olleh"',
      error: error.message
    };
  }
}

// Helper function to parse the challenge text into a structured format
function parseChallenge(challengeText) {
  const lines = challengeText.split('\n');
  const challenge = {
    title: '',
    description: '',
    constraints: '',
    visibleTestCases: [],
    hiddenTestCases: [],
    difficulty: ''
  };

  let currentSection = '';
  let currentTestCase = {};
  
  for (const line of lines) {
    if (line.startsWith('Title:')) {
      currentSection = 'title';
      challenge.title = line.replace('Title:', '').trim();
    } else if (line.startsWith('Description:')) {
      currentSection = 'description';
      challenge.description = line.replace('Description:', '').trim();
    } else if (line.startsWith('Constraints:')) {
      currentSection = 'constraints';
      challenge.constraints = line.replace('Constraints:', '').trim();
    } else if (line.startsWith('Visible Test Cases:')) {
      currentSection = 'visibleTestCases';
      // Initialize but don't add anything yet
    } else if (line.startsWith('Hidden Test Cases:')) {
      currentSection = 'hiddenTestCases';
      // Initialize but don't add anything yet
    } else if (line.startsWith('Difficulty:')) {
      currentSection = 'difficulty';
      challenge.difficulty = line.replace('Difficulty:', '').trim();
    } else if (line.trim() !== '') {
      // Process based on current section
      if (currentSection === 'title' || currentSection === 'description' || currentSection === 'constraints' || currentSection === 'difficulty') {
        // Append to the current section if it's not an empty line
        if (challenge[currentSection]) {
          challenge[currentSection] += '\n' + line.trim();
        }
      } else if (currentSection === 'visibleTestCases' || currentSection === 'hiddenTestCases') {
        // Parse test cases
        if (line.includes('Input:')) {
          // Start a new test case
          currentTestCase = { input: line.replace('Input:', '').trim() };
        } else if (line.includes('Output:') && currentTestCase.input) {
          // Complete the test case and add it to the appropriate array
          currentTestCase.expected = line.replace('Output:', '').trim();
          challenge[currentSection].push({
            input: currentTestCase.input,
            expected: currentTestCase.expected
          });
          currentTestCase = {};
        }
      }
    }
  }

  // If no test cases were parsed, create default ones based on example input/output
  if (challenge.visibleTestCases.length === 0) {
    // Extract example input/output from description if available
    const exampleMatch = challenge.description.match(/Example(\s+Input)?:\s*([\s\S]*?)\s*Example(\s+Output)?:\s*([\s\S]*?)(?=(\n\n|$))/i);
    
    if (exampleMatch && exampleMatch[2] && exampleMatch[4]) {
      const exampleInput = exampleMatch[2].trim();
      const exampleOutput = exampleMatch[4].trim();
      
      challenge.visibleTestCases.push({
        input: exampleInput,
        expected: exampleOutput
      });
    } else {
      // Default test case if no examples found
      challenge.visibleTestCases.push({
        input: "sample input",
        expected: "sample output"
      });
    }
  }

  // Generate hidden test cases if none were provided
  if (challenge.hiddenTestCases.length === 0) {
    // Use visible test cases as a base for hidden ones with slight modifications
    if (challenge.visibleTestCases.length > 0) {
      const baseCase = challenge.visibleTestCases[0];
      
      // Create two variations
      challenge.hiddenTestCases.push({
        input: baseCase.input + " (modified for hidden case 1)",
        expected: baseCase.expected + " (modified for hidden case 1)"
      });
      
      challenge.hiddenTestCases.push({
        input: baseCase.input + " (modified for hidden case 2)",
        expected: baseCase.expected + " (modified for hidden case 2)"
      });
    } else {
      // Default hidden test cases
      challenge.hiddenTestCases.push({
        input: "hidden input 1",
        expected: "hidden output 1"
      });
      
      challenge.hiddenTestCases.push({
        input: "hidden input 2",
        expected: "hidden output 2"
      });
    }
  }

  return challenge;
}

module.exports = { generateChallenge };