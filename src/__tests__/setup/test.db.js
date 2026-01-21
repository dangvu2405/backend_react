/**
 * Test Database Setup
 * Kết nối MongoDB test database
 */

const mongoose = require('mongoose');

let connection = null;

const connectTestDB = async () => {
    if (connection) {
        return connection;
    }

    const mongoURI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/perfume-shop-test';
    
    connection = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    return connection;
};

const disconnectTestDB = async () => {
    if (connection) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        connection = null;
    }
};

const clearTestDB = async () => {
    if (connection) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
};

module.exports = {
    connectTestDB,
    disconnectTestDB,
    clearTestDB
};
