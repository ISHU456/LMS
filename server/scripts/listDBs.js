import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const listDatabases = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const admin = mongoose.connection.useDb('admin').db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases on this cluster:');
        dbs.databases.forEach(db => console.log(`- ${db.name}`));
        process.exit(0);
    } catch (er) {
        console.error(er);
        process.exit(1);
    }
};

listDatabases();
