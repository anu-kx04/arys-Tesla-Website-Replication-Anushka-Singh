const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'tesla_data.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], orders: [] }, null, 2));
        console.log('✅ Initialized new JSON database: tesla_data.json');
    } catch (err) {
        console.error('❌ Failed to initialize database:', err);
    }
}

const readDb = () => {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('❌ Error reading DB:', err);
        return { users: [], orders: [] };
    }
};

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('❌ Error writing DB:', err);
        return false;
    }
};

module.exports = {
    // User Methods
    findUserByEmail: (email) => {
        const users = readDb().users;
        return users.find(u => u.email === email.toLowerCase().trim());
    },

    findUserById: (id) => {
        const users = readDb().users;
        return users.find(u => u.id === id);
    },

    createUser: (userData) => {
        const data = readDb();
        const newUser = {
            ...userData,
            id: Date.now(), // Simple ID generation
            email: userData.email.toLowerCase().trim(),
            createdAt: new Date().toISOString()
        };
        data.users.push(newUser);
        writeDb(data);
        return newUser;
    },

    // Order Methods
    findOrdersByUserId: (userId) => {
        const orders = readDb().orders;
        return orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    createOrder: (orderData) => {
        const data = readDb();
        const newOrder = {
            ...orderData,
            id: Date.now(),
            status: 'Paid',
            createdAt: new Date().toISOString()
        };
        data.orders.push(newOrder);
        writeDb(data);
        return newOrder;
    }
};
