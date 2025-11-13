const { MongoClient } = require('mongodb');
import { Long } from 'mongodb';
import crypto from 'crypto';

let cachedClient = null;
let cachedDb = null;

export async function connectToDb() {
    if (cachedClient && cachedDb) {
        return cachedDb;
    }

    const url = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DBNAME;

    const client = new MongoClient(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await client.connect();
     const db = dbName ? client.db(dbName) : client.db();

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
        // Fetch all users as an array
    const users = await database.collection('userInfo').find({}).toArray();
    
    console.log('Users in database:');
    console.log(users);  // prints array of user objects
    
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

export async function editCreditCard(filter, payload) {
    const database = await connectToDb();
    return await database.collection('creditCards').updateOne(
        filter,
        { $set: payload },
        { upsert: false }
    );
}

export async function deleteCreditCard(cardNumber) {
    const database = await connectToDb();
    return await database.collection('creditCards').deleteOne(cardNumber)
}

async function getNextExpenseId(cardNumber) {
    const database = await connectToDb();
    const result = await database.collection('creditCards').findOneAndUpdate(
        { cardNumber: cardNumber },
        { $inc: { nextExpenseId: 1 } },
        { returnOriginal: false }
    );

    if (!result.value.nextExpenseId) {
        await database.collection('creditCards').updateOne(
            { cardNumber: cardNumber },
            { $set: { nextExpenseId: 1 } }
        );
        return 1;
    }

    return result.value.nextExpenseId;
}

export async function addExpenseToCreditCard(filter, expense) {
    const database = await connectToDb();
    const nextExpenseId = await getNextExpenseId(filter.cardNumber);
    expense.expenseId = nextExpenseId;
    try {
        const result = await database.collection('creditCards').updateOne(
            filter,
            { $push: { expenses: expense } },
            { upsert: false }
        );

        if (result.modifiedCount > 0) {
            return { status: '200', message: 'Expense added successfully' };
        } else {
            return { status: '404', message: 'Credit card not found' };
        }
    } catch (error) {
        console.error('Error adding expense:', error);
        return { status: '500', message: 'Error adding expense' };
    }
}

export async function editCreditCardExpense(filter, updatedExpense) {
    const database = await connectToDb();
    const { cardNumber, expenseId } = filter;

    if (!cardNumber || !expenseId) {
        return { status: '400', message: 'Invalid filter parameters' };
    }
    try {
        const result = await database.collection('creditCards').updateOne(
            { cardNumber: cardNumber, "expenses.expenseId": expenseId },
            { $set: { "expenses.$": updatedExpense } },
            { upsert: false }
        );

        console.log('Update result:', result);

        if (result.modifiedCount > 0) {
            return { status: '200', message: 'Expense updated successfully' };
        } else {
            return { status: '404', message: 'Expense not found' };
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        return { status: '500', message: 'Error updating expense' };
    }
}

export async function deleteCreditCardExpense(filter, expenseId) {
    const database = await connectToDb();
    try {
        const result = await database.collection('creditCards').updateOne(
            filter,
            { $pull: { expenses: { expenseId } } },
            { upsert: false }
        );

        if (result.modifiedCount > 0) {
            return { status: '200', message: 'Expense deleted successfully' };
        } else {
            return { status: '404', message: 'Expense not found' };
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
        return { status: '500', message: 'Error deleting expense' };
    }
}

export async function addAllExpensesToCreditCard(cardNumber, expenses) {
    const database = await connectToDb();
    try {
        const creditCard = await database.collection('creditCards').findOne({ cardNumber });
        if (!creditCard) {
            throw new Error('Credit card not found');
        }

        const currentNextExpenseId = creditCard.nextExpenseId || 0;
        const { processedExpenses, lastExpenseId } = preprocessExpenses(expenses, currentNextExpenseId);

        // Merge with existing expenses if any.
        let updatedExpenses = [];
        if (creditCard.expenses && Array.isArray(creditCard.expenses)) {
            updatedExpenses = creditCard.expenses.concat(processedExpenses);
        } else {
            updatedExpenses = processedExpenses;
        }

        // Update the credit card document with the new expenses array and update the nextExpenseId.
        const result = await database.collection('creditCards').updateOne(
            { cardNumber },
            { $set: { nextExpenseId: lastExpenseId, expenses: updatedExpenses } }
        );

        if (result.modifiedCount > 0) {
            return { status: '200', message: 'Expense updated successfully' };
        } else {
            return { status: '404', message: 'Expense not found' };
        }
    } catch (error) {
        console.error('Error updating credit card expenses:', error);
        throw error;
    }
}

function preprocessExpenses(expenses, startingExpenseId) {
    let processedExpenses = [];
    let currentExpenseId = startingExpenseId;

    for (const expense of expenses) {
        // Each expense is an array: [rawDate, mccDescription, amount].
        const [rawDate, storeName, amount] = expense;

        // Skip the record if the amount string starts with '('.
        if (amount.trim().startsWith('(')) {
            continue;
        }

        // Convert the raw date (e.g., "05/03") to "2025-03-05".
        const [day, month] = rawDate.split('/');
        // Ensure two-digit day and month.
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = month.padStart(2, '0');
        const formattedDate = `2025-${formattedMonth}-${formattedDay}`;

        // Increment expenseId for this valid expense.
        currentExpenseId += 1;

        processedExpenses.push({
            expenseId: currentExpenseId,
            date: formattedDate,
            amount: amount.trim(),
            storeName: storeName.trim()
        });
    }
    return { processedExpenses, lastExpenseId: currentExpenseId };
}
export async function addCreditCard(payload) {
    const database = await connectToDb();
    const existingCard = await database.collection('creditCards').findOne({
        cardNumber: payload.cardNumber,
        expiryDate: payload.expiryDate,
        cardHolderName: payload.cardHolderName
    });

    if (existingCard) {
        return { status: '500', message: 'Card already exists' };
    }
    try {
        await database.collection('creditCards').insertOne(payload);
        return { status: '200', message: 'Card added successfully' };
    } catch (error) {
        console.error('Error adding credit card:', error);
        return { status: '500', message: 'Error adding card' };
    }
}

export async function getCreditCardsInfo(payload) {
    const database = await connectToDb();
    return await database.collection('creditCards').find({ userId: payload.userId }).toArray();
}

// Saved Routes functions
export async function saveRoute(routeData) {
    const database = await connectToDb();
    const currentTime = getCurrentTime();

    const routeDocument = {
        userId: routeData.userId,
        routeName: routeData.routeName,
        origin: {
            address: routeData.origin.address,
            lat: routeData.origin.lat,
            lng: routeData.origin.lng
        },
        destination: {
            address: routeData.destination.address,
            lat: routeData.destination.lat,
            lng: routeData.destination.lng
        },
        preferences: {
            shelterLevel: routeData.preferences?.shelterLevel || 50,
            travelMode: routeData.preferences?.travelMode || 'WALKING'
        },
        routeData: {
            distance: routeData.routeData?.distance || '',
            duration: routeData.routeData?.duration || '',
            sheltersCount: routeData.routeData?.sheltersCount || 0
        },
        // Save the selected route index so we can select the same option when loading
        selectedRouteIndex: routeData.selectedRouteIndex || 0,
        createdAt: currentTime,
        isFavorite: true,
        shareId: null  // Will be populated when route is shared
    };

    try {
        const result = await database.collection('savedRoutes').insertOne(routeDocument);
        return { status: '200', message: 'Route saved successfully', routeId: result.insertedId };
    } catch (error) {
        console.error('Error saving route:', error);
        return { status: '500', message: 'Error saving route', error: error.message };
    }
}

export async function getUserSavedRoutes(userId) {
    const database = await connectToDb();
    try {
        const routes = await database.collection('savedRoutes')
            .find({ userId: userId })
            .sort({ createdAt: -1 })
            .toArray();
        return { status: '200', routes: routes };
    } catch (error) {
        console.error('Error getting saved routes:', error);
        return { status: '500', message: 'Error getting saved routes', error: error.message };
    }
}

export async function getSavedRouteById(routeId, userId) {
    const database = await connectToDb();
    const { ObjectId } = require('mongodb');

    try {
        const route = await database.collection('savedRoutes').findOne({
            _id: new ObjectId(routeId),
            userId: userId
        });

        if (!route) {
            return { status: '404', message: 'Route not found' };
        }

        return { status: '200', route: route };
    } catch (error) {
        console.error('Error getting route by ID:', error);
        return { status: '500', message: 'Error getting route', error: error.message };
    }
}

export async function deleteSavedRoute(routeId, userId) {
    const database = await connectToDb();
    const { ObjectId } = require('mongodb');

    try {
        const result = await database.collection('savedRoutes').deleteOne({
            _id: new ObjectId(routeId),
            userId: userId
        });

        if (result.deletedCount > 0) {
            return { status: '200', message: 'Route deleted successfully' };
        } else {
            return { status: '404', message: 'Route not found' };
        }
    } catch (error) {
        console.error('Error deleting route:', error);
        return { status: '500', message: 'Error deleting route', error: error.message };
    }
}

export async function updateSavedRouteShareId(routeId, userId, shareId) {
    const database = await connectToDb();
    const { ObjectId } = require('mongodb');

    try {
        const result = await database.collection('savedRoutes').updateOne(
            {
                _id: new ObjectId(routeId),
                userId: userId
            },
            {
                $set: { shareId: shareId }
            }
        );

        if (result.modifiedCount > 0 || result.matchedCount > 0) {
            return { status: '200', message: 'Route shareId updated successfully' };
        } else {
            return { status: '404', message: 'Route not found' };
        }
    } catch (error) {
        console.error('Error updating route shareId:', error);
        return { status: '500', message: 'Error updating route shareId', error: error.message };
    }
}

// Shared Routes functions
function generateShareId() {
    // Generate a random 8-character URL-safe ID using Node.js crypto
    return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

export async function createSharedRoute(routeData) {
    const database = await connectToDb();
    const currentTime = getCurrentTime();

    // Generate unique share ID
    let shareId = generateShareId();

    // Check if shareId already exists, regenerate if needed
    let existing = await database.collection('sharedRoutes').findOne({ shareId });
    while (existing) {
        shareId = generateShareId();
        existing = await database.collection('sharedRoutes').findOne({ shareId });
    }

    const sharedRoute = {
        shareId,
        userId: routeData.userId,
        routeName: routeData.routeName,
        origin: {
            address: routeData.origin.address,
            lat: routeData.origin.lat,
            lng: routeData.origin.lng
        },
        destination: {
            address: routeData.destination.address,
            lat: routeData.destination.lat,
            lng: routeData.destination.lng
        },
        preferences: {
            shelterLevel: routeData.preferences?.shelterLevel || 50,
            travelMode: routeData.preferences?.travelMode || 'WALKING'
        },
        routeData: {
            distance: routeData.routeData?.distance || '',
            duration: routeData.routeData?.duration || '',
            sheltersCount: routeData.routeData?.sheltersCount || 0
        },
        selectedRouteIndex: routeData.selectedRouteIndex || 0,
        createdAt: currentTime,
        viewCount: 0
    };

    try {
        await database.collection('sharedRoutes').insertOne(sharedRoute);
        return { status: '200', message: 'Route shared successfully', shareId };
    } catch (error) {
        console.error('Error creating shared route:', error);
        return { status: '500', message: 'Error sharing route', error: error.message };
    }
}

export async function getSharedRoute(shareId) {
    const database = await connectToDb();

    try {
        const sharedRoute = await database.collection('sharedRoutes').findOne({ shareId });

        if (!sharedRoute) {
            return { status: '404', message: 'Shared route not found' };
        }

        // Increment view count
        await database.collection('sharedRoutes').updateOne(
            { shareId },
            { $inc: { viewCount: 1 } }
        );

        return { status: '200', route: sharedRoute };
    } catch (error) {
        console.error('Error getting shared route:', error);
        return { status: '500', message: 'Error getting shared route', error: error.message };
    }
}

// Add a challenge for a user
async function addUserChallenge(userChallenge) {
  const database = await connectToDb();

  // Optional: prevent duplicates
  const existing = await database.collection('userChallenges').findOne({
    userId: userChallenge.userId,
    challengeId: userChallenge.challengeId
  });

  console.log('Existing challenge check:', existing);

  if (existing) {
    return { status: '409', message: 'Challenge already added' };
  }

  const doc = {
    ...userChallenge,
    createdAt: getCurrentTime()  // reuse your existing function
  };

  const result = await database.collection('userChallenges').insertOne(doc);
  return { status: '200', message: 'Challenge added', insertedId: result.insertedId };
}

// Get all challenges added by a user
async function getUserChallenges(userId) {
  const database = await connectToDb();
  const challenges = await database.collection('userChallenges')
    .find({ userId: userId })
    .sort({ createdAt: -1 })
    .toArray();

  return challenges;
}

// Delete a challenge from a user's profile
async function deleteUserChallenge(userId, challengeId) {
  const database = await connectToDb();
  const result = await database.collection('userChallenges')
    .deleteOne({ userId: userId, challengeId: challengeId });

  if (result.deletedCount > 0) {
    return { status: '200', message: 'Challenge removed' };
  } else {
    return { status: '404', message: 'Challenge not found' };
  }
}

// Export these functions using ES module syntax
export { addUserChallenge, getUserChallenges, deleteUserChallenge };




