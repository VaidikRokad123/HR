import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const fixIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGODB_DB_NAME
    });
    console.log('MongoDB Connected');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // List all indexes
    console.log('\nCurrent indexes:');
    const indexes = await usersCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop ALL indexes except _id
    console.log('\nDropping all indexes except _id...');
    await usersCollection.dropIndexes();
    console.log('✅ All indexes dropped');

    // Create new sparse unique index
    console.log('\nCreating new sparse unique index on emp_code...');
    await usersCollection.createIndex(
      { emp_code: 1 }, 
      { unique: true, sparse: true, name: 'emp_code_sparse' }
    );
    console.log('✅ Created new sparse unique index on emp_code');

    // Verify new indexes
    console.log('\nNew indexes:');
    const newIndexes = await usersCollection.indexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Index fix completed successfully!');
    console.log('You can now register employees without issues.');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
