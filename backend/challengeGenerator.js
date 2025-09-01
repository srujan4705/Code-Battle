require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');
const LocalChallengeStore = require('./models/LocalChallengeStore');

// Log MongoDB connection status
console.log('Using MongoDB for challenge retrieval');

// Set MongoDB connection options
mongoose.set('bufferTimeoutMS', 30000); // Increase buffer timeout to 30 seconds

// Ensure MongoDB connection
let isConnected = false;
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established in challengeGenerator');
  isConnected = true;
});

// Connect to MongoDB if not already connected
if (mongoose.connection.readyState !== 1) {
  mongoose.connect(process.env.MONGO_URI)
    .catch(err => {
      console.error('MongoDB connection error in challengeGenerator:', err);
    });
}

// Function to retrieve a coding challenge from MongoDB or local storage
async function generateChallenge(difficulty = 'medium') {
  try {
    // Map difficulty to ID prefix
    let idPrefix;
    switch(difficulty.toLowerCase()) {
      case 'easy':
        idPrefix = 'E';
        break;
      case 'medium':
        idPrefix = 'M';
        break;
      case 'hard':
        idPrefix = 'H';
        break;
      default:
        idPrefix = 'M'; // Default to medium if invalid difficulty
    }
    
    // Normalize difficulty to match the schema (first letter uppercase, rest lowercase)
    const normalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

    try {
      // Try MongoDB first with normalized difficulty
      const query = {
        difficulty: normalizedDifficulty
      };
      
      // We'll only filter by difficulty since the schema doesn't have an id field
      // The ID prefix logic is used for local storage fallback
      
      const count = await Challenge.countDocuments(query);
      
      if (count === 0) {
        console.log(`No challenges found in MongoDB for difficulty ${normalizedDifficulty}. Falling back to local storage.`);
        // Skip MongoDB and go directly to local storage since there are no challenges in MongoDB
        throw new Error('No challenges found in MongoDB');
      }
      
      // Get a random challenge matching the criteria
      const randomIndex = Math.floor(Math.random() * count);
      const challenge = await Challenge.findOne(query).skip(randomIndex);
      
      if (challenge) {
        console.log(`Retrieved challenge from MongoDB: ${challenge.title} (ID: ${challenge.id})`);
        return challenge;
      }
      
      throw new Error('No challenges found in MongoDB');
    } catch (mongoError) {
      console.log('MongoDB retrieval failed, falling back to local storage:', mongoError.message);
      
      // Fall back to local storage with ID prefix filter and case-insensitive difficulty matching
      const regex = new RegExp(`^${idPrefix}`);
      let challenges = LocalChallengeStore.challenges.filter(challenge => {
        return challenge.id.match(regex) && 
               (challenge.difficulty.toLowerCase() === difficulty.toLowerCase());
      });
      
      // If no match with specific difficulty, try any challenge with matching ID prefix
      if (challenges.length === 0) {
        console.log(`No challenges found in local storage for difficulty ${normalizedDifficulty}. Trying any difficulty with ID prefix ${idPrefix}.`);
        challenges = LocalChallengeStore.challenges.filter(challenge => {
          return challenge.id.match(regex);
        });
        
        // If still no matches, fall back to any challenge
        if (challenges.length === 0) {
          console.log(`No challenges found in local storage with ID prefix ${idPrefix}. Falling back to any challenge.`);
          challenges = LocalChallengeStore.challenges;
        }
      }
      
      if (challenges.length > 0) {
        // Get a random challenge
        const randomIndex = Math.floor(Math.random() * challenges.length);
        const challenge = challenges[randomIndex];
        
        // Ensure challenge has exampleInput and exampleOutput fields
        if (!challenge.exampleInput && challenge.sample_testcases && challenge.sample_testcases.length > 0) {
          challenge.exampleInput = challenge.sample_testcases[0].input;
        }
        
        if (!challenge.exampleOutput && challenge.sample_testcases && challenge.sample_testcases.length > 0) {
          challenge.exampleOutput = challenge.sample_testcases[0].output;
        }
        console.log(`Retrieved challenge from local storage: ${challenge.title} (ID: ${challenge.id})`);
        return challenge;
      }
      
      throw new Error(`No challenges available with prefix ${idPrefix} in local storage`);
    }
  } catch (error) {
    console.error(`Error retrieving challenge from MongoDB: ${error.message}`);
    
    // Fallback challenges in case of database error
    const fallbackChallenges = [
      {
        title: 'Reverse a String ',
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

// Make sure the function is properly exported
module.exports = { generateChallenge };