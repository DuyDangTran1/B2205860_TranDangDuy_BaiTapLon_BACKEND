const {connectDB, getCollection} = require('../ConnectMongoDB/ConnectMongoDB');

const getCountCollection = async (collection) => {
    await connectDB();
    const countCollection = await getCollection("Count");
    return countCollection.findOne(collection);   
}

const updateCountCollection = async (collectionName, new_count) => {
  await connectDB();
  const countCollection = await getCollection("Count");
  const result = await countCollection.updateOne(
    { collection: collectionName },
    { $set: { count: new_count } }
  );
  return result.modifiedCount > 0;
};

module.exports = {
    getCountCollection,
    updateCountCollection,
};