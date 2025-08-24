const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
require('dotenv').config();

// Initialize the OpenAI model
const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  modelName: 'gpt-3.5-turbo',
  // Add additional configuration for error handling
  maxRetries: 3,
  timeout: 30000, // 30 seconds timeout
});

// Log OpenAI initialization status
console.log('OpenAI model initialized with API key format:', 
  process.env.OPENAI_API_KEY ? 
  `${process.env.OPENAI_API_KEY.substring(0, 7)}...` : 
  'No API key found');

// Note: If you're seeing fallback challenges, it's likely because:
// 1. The API key format is incorrect (should be sk-... not sk-proj-...)
// 2. The API key has expired or has no credits
// 3. There are network issues reaching the OpenAI API

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
    // Provide more detailed error information
    let errorType = 'Unknown error';
    let errorDetails = '';
    
    if (error.name === 'AuthenticationError' || error.message.includes('authentication')) {
      errorType = 'API Key Authentication Error';
      errorDetails = 'The OpenAI API key is invalid, expired, or in the wrong format. Check your .env file.';
    } else if (error.name === 'RateLimitError' || error.message.includes('rate limit')) {
      errorType = 'Rate Limit Error';
      errorDetails = 'The OpenAI API rate limit has been exceeded. Try again later or upgrade your plan.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      errorType = 'Timeout Error';
      errorDetails = 'The request to OpenAI API timed out. Check your network connection.';
    } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
      errorType = 'Network Error';
      errorDetails = 'Could not connect to the OpenAI API. Check your internet connection.';
    }
    
    console.error(`Error generating challenge: ${errorType}`, error);
    console.error(`Error details: ${errorDetails}`);
    
    // Array of fallback challenges to choose from
    const fallbackChallenges = [
      {
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
        exampleOutput: '"olleh"'
      },
      {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
        constraints: 'You can return the answer in any order. 2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9',
        visibleTestCases: [
          { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
          { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' }
        ],
        hiddenTestCases: [
          { input: 'nums = [3,3], target = 6', expected: '[0,1]' },
          { input: 'nums = [1,5,8,3], target = 11', expected: '[1,2]' }
        ],
        difficulty: 'Easy',
        exampleInput: 'nums = [2,7,11,15], target = 9',
        exampleOutput: '[0,1]'
      },
      {
        title: 'Palindrome Number',
        description: 'Given an integer x, return true if x is a palindrome, and false otherwise. A palindrome is a number that reads the same backward as forward.',
        constraints: '-2^31 <= x <= 2^31 - 1',
        visibleTestCases: [
          { input: '121', expected: 'true' },
          { input: '-121', expected: 'false' }
        ],
        hiddenTestCases: [
          { input: '10', expected: 'false' },
          { input: '12321', expected: 'true' }
        ],
        difficulty: 'Easy',
        exampleInput: '121',
        exampleOutput: 'true'
      },
      {
        title: 'FizzBuzz',
        description: 'Write a function that returns an array of strings for numbers from 1 to n. For multiples of 3, use "Fizz" instead of the number. For multiples of 5, use "Buzz". For numbers that are multiples of both 3 and 5, use "FizzBuzz".',
        constraints: '1 <= n <= 10^4',
        visibleTestCases: [
          { input: '3', expected: '["1","2","Fizz"]' },
          { input: '5', expected: '["1","2","Fizz","4","Buzz"]' }
        ],
        hiddenTestCases: [
          { input: '15', expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
          { input: '8', expected: '["1","2","Fizz","4","Buzz","Fizz","7","8"]' }
        ],
        difficulty: 'Easy',
        exampleInput: '3',
        exampleOutput: '["1","2","Fizz"]'
      },
      {
        title: 'Valid Anagram',
        description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram is a word formed by rearranging the letters of a different word, using all the original letters exactly once.',
        constraints: '1 <= s.length, t.length <= 5 * 10^4, s and t consist of lowercase English letters.',
        visibleTestCases: [
          { input: 's = "anagram", t = "nagaram"', expected: 'true' },
          { input: 's = "rat", t = "car"', expected: 'false' }
        ],
        hiddenTestCases: [
          { input: 's = "listen", t = "silent"', expected: 'true' },
          { input: 's = "hello", t = "world"', expected: 'false' }
        ],
        difficulty: 'Easy',
        exampleInput: 's = "anagram", t = "nagaram"',
        exampleOutput: 'true'
      }
    ];
    
    // Randomly select a fallback challenge
    const randomIndex = Math.floor(Math.random() * fallbackChallenges.length);
    const selectedChallenge = fallbackChallenges[randomIndex];
    
    // Add error message to the selected challenge
    return {
      ...selectedChallenge,
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