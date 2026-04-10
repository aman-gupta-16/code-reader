import mongoose from 'mongoose';

export async function connectDatabase(mongodbUri) {
  await mongoose.connect(mongodbUri, {
    autoIndex: true,
  });

  return mongoose.connection;
}
