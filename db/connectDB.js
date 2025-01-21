const mongoose = require("mongoose");

const mongo = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB, {}); 
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1); 
    }
};

module.exports = mongo