const mongoose = require('mongoose');
const config = require('./config/configs');
const User = require('./models/user');

const users = [
  { name: 'Maya Chen', email: 'maya.chen@example.com', age: 23, gender: 'f' },
  { name: 'Jordan Patel', email: 'jordan.patel@example.com', age: 26, gender: 'm' },
  { name: 'Sofia Martin', email: 'sofia.martin@example.com', age: 29, gender: 'f' },
  { name: 'Noah Tremblay', email: 'noah.tremblay@example.com', age: 31, gender: 'm' }
];

async function seed() {
  await mongoose.connect(config.db);
  try {
    await User.init();
    const result = await User.bulkWrite(users.map(user => ({
      updateOne: {
        filter: { email: user.email },
        update: { $setOnInsert: user },
        upsert: true
      }
    })));
    console.log(`Added ${result.upsertedCount} sample users.`);
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
