const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/krishak')
  .then(async () => {
    console.log('\n✅ Connected to MongoDB\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📁 DATABASE: krishak');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📦 Collections found:', collections.length);
    console.log('───────────────────────────────────────────────────────────\n');

    // Show data from each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      console.log(`📋 Collection: ${collectionName}`);
      console.log(`   Documents: ${data.length}`);
      
      if (data.length > 0) {
        console.log('\n   Sample Data:');
        data.forEach((doc, index) => {
          console.log(`\n   Document ${index + 1}:`);
          console.log(JSON.stringify(doc, null, 2).split('\n').map(line => '   ' + line).join('\n'));
        });
      } else {
        console.log('   (empty collection)');
      }
      console.log('\n───────────────────────────────────────────────────────────\n');
    }

    mongoose.connection.close();
    console.log('✅ Connection closed\n');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
