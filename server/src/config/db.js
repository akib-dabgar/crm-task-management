import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/actowiz_task_manager';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to database`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Database connection lost');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Database reconnected successfully');
});
