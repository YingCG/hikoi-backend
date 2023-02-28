import { MongoClient } from "mongodb";
let db;

const MONGO_URL = "mongodb+srv://curious-earthworm:GrowGarlic@byo-cup-corner.sqa3qxz.mongodb.net/?retryWrites=true&w=majority";

async function connectToDb(callback) {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db("hikoi-data");
    callback()
}

export { db, connectToDb }