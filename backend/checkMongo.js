require('dotenv').config();
const mongoose = require('mongoose');
const Challenge = require('./models/Challenge');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Count total challenges
    const totalCount = await Challenge.countDocuments({});
    console.log(`Total challenges in MongoDB: ${totalCount}`);
    
    // Count challenges by difficulty
    const easyCount = await Challenge.countDocuments({ difficulty: 'Easy' });
    const mediumCount = await Challenge.countDocuments({ difficulty: 'Medium' });
    const hardCount = await Challenge.countDocuments({ difficulty: 'Hard' });
    
    console.log(`Easy challenges: ${easyCount}`);
    console.log(`Medium challenges: ${mediumCount}`);
    console.log(`Hard challenges: ${hardCount}`);
    
    // Check lowercase difficulties
    const easyLowerCount = await Challenge.countDocuments({ difficulty: 'easy' });
    const mediumLowerCount = await Challenge.countDocuments({ difficulty: 'medium' });
    const hardLowerCount = await Challenge.countDocuments({ difficulty: 'hard' });
    
    console.log(`easy (lowercase) challenges: ${easyLowerCount}`);
    console.log(`medium (lowercase) challenges: ${mediumLowerCount}`);
    console.log(`hard (lowercase) challenges: ${hardLowerCount}`);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });