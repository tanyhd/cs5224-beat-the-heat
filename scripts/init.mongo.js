/*
 * Run using the mongo shell. For remote databases, ensure that the
 * connection string is supplied in the command line. For example:
 * localhost:
 *   mongo beat_the_heat scripts/init.mongo.js
 */

db.userInfo.remove({});
db.scrapedData.remove({});

const count = db.userInfo.count();
print('Inserted', count, 'user');
db.counters.remove({ _id: 'fixedindex' });
db.counters.insert({ _id: 'fixedindex', current: count });
