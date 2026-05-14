import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      dbName: process.env.MONGODB_DB_NAME
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    // Specifically check for authentication error like "bad auth"
    if (error.name === 'MongoServerError' && error.code === 8000) {
      console.error('   Authentication failed. Please check your MONGODB_URI in the .env file to ensure the username and password are correct.');
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;