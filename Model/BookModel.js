const { ObjectId } = require("mongodb");
const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB.js");
async function getAllBook() {
  await connectDB();
  const bookCollection = getCollection("SACH");
  return await bookCollection.find().toArray();
}

async function getBookPage(page, limit) {
  const index = (page - 1) * limit;
  const db = await connectDB();
  const bookCollection = getCollection("SACH");
  return await bookCollection.find().skip(index).limit(limit).toArray();
}

async function created() {
  const db = await connectDB();
  const bookCollection = getCollection("SACH");

  return await bookCollection.updateMany(
    { CREATED: { $exists: false } },
    { $set: { CREATED: new Date() } }
  );
}

async function getNewBook() {
  await connectDB();
  const bookCollection = getCollection("SACH");
  return bookCollection.find().sort({ CREATED: -1 }).limit(10).toArray();
}

async function getBookById(id) {
  await connectDB();
  const bookCollection = getCollection("SACH");
  return bookCollection.findOne({ _id: new ObjectId(id) });
}

async function getAllBookByCategoryPage(MATL, page, limit) {
  const index = (page - 1) * limit;
  await connectDB();
  const bookCollection = getCollection("SACH");
  return await bookCollection
    .find({ MATL: MATL })
    .skip(index)
    .limit(limit)
    .toArray();
}

async function getAllBookByCategory(MATL) {
  const db = await connectDB();
  const bookCollection = getCollection("SACH");
  return await bookCollection.find({ MATL: MATL }).toArray();
}

module.exports = {
  getAllBook,
  getBookPage,
  created,
  getNewBook,
  getBookById,
  getAllBookByCategoryPage,
  getAllBookByCategory,
};
