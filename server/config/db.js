const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic for production resilience.
 */
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      retries += 1;
      console.error(`❌ MongoDB connection attempt ${retries}/${maxRetries} failed: ${err.message}`);
      if (retries === maxRetries) {
        console.error('Exhausted all MongoDB connection retries. Exiting.');
        process.exit(1);
      }
      // Wait 2 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

module.exports = connectDB;