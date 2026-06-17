const mongoose = require('mongoose');
const { connectDB, Developer } = require('@urbackend/common');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function list() {
    await connectDB();
    try {
        const developers = await Developer.find({});
        console.log("All developers in DB:");
        developers.forEach(d => {
            let maskedEmail = d.email;
            if (maskedEmail && maskedEmail.includes('@')) {
                const [user, domain] = maskedEmail.split('@');
                maskedEmail = user.slice(0, 3) + '***@' + domain;
            }
            console.log(`- Email: ${maskedEmail}, isVerified: ${d.isVerified}`);
        });
    } finally {
        await mongoose.connection.close();
    }
}

list().catch(console.error);
