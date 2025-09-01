require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Challenge = require('./models/Challenge');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected for seeding');
  seedDatabase();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

async function seedDatabase() {
  try {
    // Read challenges from JSON file
    const challengesPath = path.join(__dirname, 'data', 'challenges.json');
    const challengesData = JSON.parse(fs.readFileSync(challengesPath, 'utf8'));
    
    // Check if challenges already exist
    const count = await Challenge.countDocuments();
    
    if (count > 0) {
      console.log(`Database already has ${count} challenges. Skipping seeding.`);
      console.log('To reseed, run with FORCE_SEED=true environment variable.');
      
      if (process.env.FORCE_SEED === 'true') {
        // Delete all existing challenges if FORCE_SEED is true
        await Challenge.deleteMany({});
        console.log('Deleted all existing challenges. Reseeding...');
      } else {
        process.exit(0);
      }
    }
    
    // Insert challenges into database
    const result = await Challenge.insertMany(challengesData);
    console.log(`✅ Successfully seeded ${result.length} challenges`);
    
    // Log the inserted challenges
    console.log('Challenges in database:');
    const challenges = await Challenge.find({}, 'title difficulty');
    challenges.forEach(challenge => {
      console.log(`- ${challenge.title} (${challenge.difficulty})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}