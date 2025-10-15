/*
 * Run using the mongo shell. For remote databases, ensure that the
 * connection string is supplied in the command line. For example:
 * localhost:
 *  mongo beat_the_heat scripts/init.mongo.js
 *  or
 *  mongosh beat_the_heat scripts/init.mongo.js 
 */

db.userInfo.remove({});
db.scrapedData.remove({});

db.userInfo.insert({
    "userId": 1,
    "email": "testing123@gmail.com",
    "name": "tester1",
    "password": "$2b$10$5LVczCWBw6YYFZvgJ9Lg/Odh/kfRVIxfuE8xfY4yu7GtA3LyVeI86",
    "token": "6803aee3f4007b2b1cc3e6af",
    "tokenTime": NumberLong("1745071843"),
    "createdAt": NumberLong("1745071843")
});

const count = db.userInfo.count();
print('Inserted', count, 'user');
db.counters.remove({ _id: 'fixedindex' });
db.counters.insert({ _id: 'fixedindex', current: count });
