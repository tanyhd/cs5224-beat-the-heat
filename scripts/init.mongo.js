/*
 * Run using the mongo shell. For remote databases, ensure that the
 * connection string is supplied in the command line. For example:
 * localhost:
 *   mongo courseproject3 scripts/init.mongo.js
 */

db.userInfo.remove({});
db.creditCards.remove({});
db.scrapedData.remove({});

// Inserting dummy user information
// email: testing123@gmail.com
// password: 12345 
db.userInfo.insert({
    "userId": 1,
    "email": "testing123@gmail.com",
    "name": "tester1",
    "password": "$2b$10$5LVczCWBw6YYFZvgJ9Lg/Odh/kfRVIxfuE8xfY4yu7GtA3LyVeI86",
    "token": "6803aee3f4007b2b1cc3e6af",
    "tokenTime": NumberLong("1745071843"),
    "createdAt": NumberLong("1745071843")
});

// Inserting credit card information
db.creditCards.insertMany([
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407259407",
        "cvv": "123",
        "expiry": "12/2028",
        "trackAllowed": true,
        "cardApprovalDate": "2025-04-09",
        "rewardsType": "Citi Rewards Card",
        "rewardsId": "rewards",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2020/05/citi-rewards-transparent-8.png",
        "userId": 1,
        "nextExpenseId": 1,
        "expenses": [
            {
                "date": "2025-04-12",
                "amount": "12",
                "mcc": "5814",
                "mccDescription": "FAST FOOD RESTAURANTS",
                "storeName": "MCDONALDS",
                "expenseId": 1
            }
        ]
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407259506",
        "cvv": "456",
        "expiry": "11/2027",
        "trackAllowed": false,
        "cardApprovalDate": "2025-04-01",
        "rewardsType": "DBS Altitude Card",
        "rewardsId": "altamex",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2022/07/dbs-altitude-visa-amex.jpg",
        "userId": 1,
        "nextExpenseId": 1,
        "expenses": [
            {
                "date": "2025-04-15",
                "amount": "45",
                "mcc": "5812",
                "mccDescription": "ELECTRONICS STORES",
                "storeName": "Best Buy",
                "expenseId": 1
            }
        ]
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407259902",
        "cvv": "123",
        "expiry": "12/2028",
        "trackAllowed": true,
        "cardApprovalDate": "2025-04-09",
        "rewardsType": "StanChart Beyond Card",
        "rewardsId": "beyond",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2024/11/sg-beyongcard_card_face-new.png",
        "userId": 1,
        "nextExpenseId": 1,
        "expenses": [
            {
                "date": "2025-04-12",
                "amount": "12",
                "mcc": "5814",
                "mccDescription": "FAST FOOD RESTAURANTS",
                "storeName": "MCDONALDS",
                "expenseId": 1
            }
        ]
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407250000",
        "cvv": "123",
        "expiry": "08/2027",
        "trackAllowed": true,
        "cardApprovalDate": "2025-04-19",
        "rewardsType": "AMEX KrisFlyer Ascend",
        "rewardsId": "ascend",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2019/10/ascend-1-1.jpg",
        "userId": 1
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407251065",
        "cvv": "456",
        "expiry": "12/2028",
        "trackAllowed": true,
        "cardApprovalDate": "2025-04-06",
        "rewardsType": "AMEX KrisFlyer Credit Card",
        "rewardsId": "kfcc",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2020/01/AMEX-Krisflyer-Blue.jpg",
        "userId": 1
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407251032",
        "cvv": "667",
        "expiry": "03/2029",
        "trackAllowed": true,
        "cardApprovalDate": "2025-03-04",
        "rewardsType": "AMEX Platinum Charge",
        "rewardsId": "platcharge",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2020/05/amex-platinum-charge-card.png",
        "userId": 1
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407251602",
        "cvv": "446",
        "expiry": "05/2028",
        "trackAllowed": false,
        "cardApprovalDate": "2025-05-01",
        "rewardsType": "Citi PremierMiles Card",
        "rewardsId": "premiermiles",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2020/05/citi-premiermiles-transparent-2.png",
        "userId": 1
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407251305",
        "cvv": "556",
        "expiry": "03/2026",
        "trackAllowed": true,
        "cardApprovalDate": "2025-01-29",
        "rewardsType": "DBS Vantage Card",
        "rewardsId": "vantage",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2022/06/dbs-vantage-transparent.png",
        "userId": 1
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407253905",
        "cvv": "774",
        "expiry": "11/2027",
        "trackAllowed": true,
        "cardApprovalDate": "2025-04-18",
        "rewardsType": "HSBC TravelOne Card",
        "rewardsId": "travelone",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2023/05/HSBC-TravelOne_Vertical-Full-compressed.jpg",
        "userId": 1
    },
    {
        "provider": "Visa",
        "name": "tester",
        "cardNumber": "4395842407255900",
        "cvv": "334",
        "expiry": "10/2028",
        "trackAllowed": true,
        "cardApprovalDate": "2025-04-16",
        "rewardsType": "StanChart Journey Card",
        "rewardsId": "journey",
        "rewardsImageUrl": "https://milelion.com/wp-content/uploads/2023/05/Journey-Card.png",
        "userId": 1
    }

]);


const count = db.userInfo.count();
print('Inserted', count, 'user');
db.counters.remove({ _id: 'fixedindex' });
db.counters.insert({ _id: 'fixedindex', current: count });
