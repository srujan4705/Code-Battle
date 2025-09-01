const fs = require('fs');
const path = require('path');

/**
 * A local file-based challenge store that serves as a fallback when MongoDB is unavailable
 */
class LocalChallengeStore {
  constructor() {
    this.challengesPath = path.join(__dirname, '..', 'data', 'challenges.json');
    this.challenges = [];
    this.loadChallenges();
  }

  /**
   * Load challenges from the JSON file
   */
  loadChallenges() {
    try {
      if (fs.existsSync(this.challengesPath)) {
        const data = fs.readFileSync(this.challengesPath, 'utf8');
        this.challenges = JSON.parse(data);
        console.log(`✅ Loaded ${this.challenges.length} challenges from local storage`);
      } else {
        console.error(`❌ Challenge data file not found at ${this.challengesPath}`);
        this.challenges = [];
      }
    } catch (error) {
      console.error('❌ Error loading challenges from file:', error);
      this.challenges = [];
    }
  }

  /**
   * Find challenges matching the given criteria
   * @param {Object} query - Query object with language, difficulty, or id regex
   * @returns {Array} - Array of matching challenges
   */
  find(query = {}) {
    return this.challenges.filter(challenge => {
      // Match language if specified - assume 'javascript' if not set in challenge
      if (query.language && (challenge.language || 'javascript') !== query.language.toLowerCase()) {
        return false;
      }
      
      // Match difficulty if specified
      if (query.difficulty && challenge.difficulty !== query.difficulty) {
        return false;
      }
      
      // Match ID with regex if specified
      if (query.id && query.id.$regex && !query.id.$regex.test(challenge.id)) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Find one challenge matching the given criteria
   * @param {Object} query - Query object with language, difficulty, or id regex
   * @returns {Object|null} - Matching challenge or null
   */
  findOne(query = {}) {
    const challenges = this.find(query);
    if (challenges.length === 0) return null;
    
    // Return a random challenge from the matches
    const randomIndex = Math.floor(Math.random() * challenges.length);
    return challenges[randomIndex];
  }

  /**
   * Count documents matching the query
   * @param {Object} query - Query object
   * @returns {Number} - Count of matching challenges
   */
  countDocuments(query = {}) {
    return this.find(query).length;
  }
}

module.exports = new LocalChallengeStore();