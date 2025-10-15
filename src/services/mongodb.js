const { MongoClient } = require('mongodb');
import { Long } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

export async function connectToDb() {
    if (cachedClient && cachedDb) {
        return cachedDb;
    }

    const url = 'mongodb://localhost/beat_the_heat';
    const client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db();

    cachedClient = client;
    cachedDb = db;
    console.log('Connected to db at', url);

    return db;
}

export async function saveScrapedData(scrapedData) {
    const database = await connectToDb();

    // Delete all existing data
    await database.collection('scrapedData').deleteMany({});

    // Insert new scraped data
    return await database.collection('scrapedData').insertMany(scrapedData);
}

export async function findAllScrapedData() {
    const database = await connectToDb();
    return await database.collection('scrapedData').find({}).toArray();
}

export async function findUserByEmail(email) {
    const database = await connectToDb();
    return await database.collection('userInfo').findOne({ email });
}

export async function addNewUser(email, name, password, token) {
    const database = await connectToDb();
    const currentTime = getCurrentTime()
    const userId = await getNextUserId('fixedindex');;

    return await database.collection('userInfo').insertOne(
        {
            "userId": userId,
            "email": email,
            "name": name,
            "password": password,
            "token": token,
            "tokenTime": currentTime,
            "createdAt": currentTime
        });
}

export async function updateUserToken(email, token) {
    const database = await connectToDb();
    const tokenTime = getCurrentTime()

    return await database.collection('userInfo').updateOne(
        { email: email }, // Filter condition
        {
            $set: {
                token: token,
                tokenTime: tokenTime
            }
        }
    );
}

function getCurrentTime() {
    const currentUnixTime = Math.floor(Date.now() / 1000);
    return Long.fromNumber(currentUnixTime);
}

export async function checkUserToken(token) {
    const database = await connectToDb();
    const userInfo = await database.collection('userInfo').findOne({ token });
    if (!userInfo) {
        return false
    }

    const THREE_DAYS_IN_SECONDS = 3 * 24 * 60 * 60; // 3 days in seconds
    const currentTime = getCurrentTime()

    if (userInfo.tokenTime < (currentTime - THREE_DAYS_IN_SECONDS)) {
        console.log("Token is older than 3 days")
        return false
    }
    return userInfo
}

async function getNextUserId(name) {
    const database = await connectToDb();
    const result = await database.collection('counters').findOneAndUpdate(
        { _id: name },//find the entry that matches this _id
        { $inc: { current: 1 } }, //perform the update
        { returnOriginal: false },//do not return the old value, only updated counter value.
    );
    return result.value.current;
}

export async function updateUserInfo(userId, userName, userEmail) {
    const database = await connectToDb();
    return await database.collection('userInfo').findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                name: userName,
                email: userEmail,
            }
        },
        { returnDocument: "after" }
    )
}

export async function updateUserPassword(userId, newPassword) {
    const database = await connectToDb();
    return await database.collection('userInfo').findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                password: newPassword,
            }
        },
        { returnDocument: "after" }
    )
}

export async function deleteUserInfo(userId) {
    const database = await connectToDb();
    return await database.collection('userInfo').deleteOne({ userId: userId });
}

