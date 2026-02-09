/**
 * MongoDB Data Debug Test
 * Checks if data is being saved to MongoDB correctly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SleepData = require('./models/SleepData');

async function testMongoDBData() {
    console.log('🔍 MongoDB Data Debug Test\n');

    try {
        // Test 1: Check MongoDB Connection
        console.log('✅ Test 1: MongoDB Connection');
        const mongoUri = process.env.MONGO_URI;
        
        if (!mongoUri) {
            console.error('   ❌ MONGO_URI not set in .env file!');
            console.log('   Please add: MONGO_URI=mongodb://... to .env');
            process.exit(1);
        }
        
        console.log('   ✓ MONGO_URI configured:', mongoUri.substring(0, 40) + '...');
        
        // Connect to MongoDB
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('   ✓ Connected to MongoDB successfully\n');

        // Test 2: Check if SleepData collection exists and count documents
        console.log('✅ Test 2: SleepData Collection Check');
        const count = await SleepData.countDocuments({});
        console.log(`   ✓ Total documents in SleepData: ${count}`);
        
        if (count === 0) {
            console.log('   ⚠️  WARNING: No data in SleepData collection!');
            console.log('   This means data is NOT being saved to MongoDB\n');
        } else {
            console.log('   ✓ Data exists in MongoDB\n');
        }

        // Test 3: Retrieve all data
        console.log('✅ Test 3: Retrieve All Data');
        const allData = await SleepData.find({}).limit(5);
        
        if (allData.length === 0) {
            console.log('   ❌ No data found in database');
        } else {
            console.log(`   ✓ Found ${allData.length} document(s):\n`);
            
            allData.forEach((doc, index) => {
                console.log(`   Document ${index + 1}:`);
                console.log(`     - _id: ${doc._id}`);
                console.log(`     - userId: ${doc.userId}`);
                console.log(`     - sleepStages: ${doc.sleepStages.join(', ')}`);
                console.log(`     - hrv: ${doc.hrv}`);
                console.log(`     - spo2: ${doc.spo2}`);
                console.log(`     - movement: ${doc.movement}`);
                console.log(`     - breathing: ${doc.breathing}`);
                console.log(`     - timestamp: ${doc.timestamp}`);
                console.log();
            });
        }

        // Test 4: Group data by userId
        console.log('✅ Test 4: Data by User');
        const pipeline = [
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    records: { $push: '$$ROOT' }
                }
            }
        ];
        
        const groupedData = await SleepData.aggregate(pipeline);
        
        if (groupedData.length === 0) {
            console.log('   ❌ No users with data');
        } else {
            console.log(`   ✓ Found data for ${groupedData.length} user(s):\n`);
            
            groupedData.forEach(group => {
                console.log(`   User ${group._id}: ${group.count} record(s)`);
            });
        }

        // Test 5: Check for missing userId
        console.log('\n✅ Test 5: Data Integrity Check');
        const missingUserId = await SleepData.find({ userId: null });
        
        if (missingUserId.length > 0) {
            console.log(`   ⚠️  WARNING: ${missingUserId.length} record(s) with missing userId!`);
            console.log('   This would cause export to fail!\n');
        } else {
            console.log('   ✓ All records have valid userId\n');
        }

        // Test 6: Check userId types
        console.log('✅ Test 6: UserId Data Types');
        const sample = await SleepData.findOne({ userId: { $exists: true } });
        
        if (sample) {
            console.log(`   ✓ Sample userId: ${sample.userId}`);
            console.log(`   ✓ Type: ${typeof sample.userId}`);
            console.log(`   ✓ Is ObjectId: ${mongoose.Types.ObjectId.isValid(sample.userId)}\n`);
        } else {
            console.log('   ❌ No documents with userId found\n');
        }

        // Test 7: Simulate export query
        console.log('✅ Test 7: Simulate Export Query');
        const testUserId = groupedData.length > 0 ? groupedData[0]._id : null;
        
        if (!testUserId) {
            console.log('   ❌ No userId to test export with');
        } else {
            console.log(`   Testing export for userId: ${testUserId}`);
            
            const exportData = await SleepData.find({ userId: testUserId });
            console.log(`   ✓ Found ${exportData.length} records for export`);
            
            if (exportData.length > 0) {
                console.log('   ✓ Export would succeed!\n');
            } else {
                console.log('   ❌ Export would fail - no data!\n');
            }
        }

        // Test 8: Check MongoDB Index
        console.log('✅ Test 8: MongoDB Indexes');
        const indexes = await SleepData.collection.getIndexes();
        console.log('   Indexes:');
        Object.keys(indexes).forEach(key => {
            console.log(`     - ${key}`);
        });
        console.log();

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        console.error('\nTroubleshooting:');
        console.error('1. Check if MongoDB is running');
        console.error('2. Check MONGO_URI in .env file');
        console.error('3. Verify network connectivity to MongoDB');
        console.error('4. Check MongoDB credentials');
    } finally {
        // Close connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('📊 MongoDB connection closed');
        }
    }
}

// Run test
testMongoDBData();
