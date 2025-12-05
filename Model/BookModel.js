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

async function getAllInforBooks() {
  await connectDB();
  const bookCollection = getCollection("SACH");

  const books = await bookCollection
    .aggregate([
      // Join THELOAI
      {
        $lookup: {
          from: "THELOAISACH",
          localField: "MATL",
          foreignField: "MATL",
          as: "theLoaiInfo",
        },
      },
      { $unwind: { path: "$theLoaiInfo", preserveNullAndEmptyArrays: true } },

      // Join NHAXUATBAN
      {
        $lookup: {
          from: "NHAXUATBAN",
          localField: "MANXB",
          foreignField: "MANXB",
          as: "nhaXBInfo",
        },
      },
      { $unwind: { path: "$nhaXBInfo", preserveNullAndEmptyArrays: true } },

      // Chọn field trả về
      {
        $project: {
          _id: 1,
          MASACH: 1,
          TENSACH: 1,
          TACGIA: 1,
          SOQUYEN: 1,
          DONGIA: 1,
          NAMXUATBAN: 1,
          URL: 1,
          MOTA: 1,
          CREATED: 1,

          MATL: 1,
          TENTHELOAI: { $ifNull: ["$theLoaiInfo.TENTHELOAI", "Không rõ TL"] },

          MANXB: 1,
          TENNHAXB: { $ifNull: ["$nhaXBInfo.TENNHAXB", "Không rõ NXB"] },
        },
      },
    ])
    .toArray();

  return books;
}

const addBook = async (book) => {
  await connectDB();
  const bookCollection = getCollection("SACH");
  return bookCollection.insertOne(book);
};

async function updateBook(id, data) {
  await connectDB();
  const bookCollection = getCollection("SACH");
  return bookCollection.updateOne({ _id: new ObjectId(id) }, { $set: data });
}

async function deleteBook(id) {
  await connectDB();
  const bookCollection = getCollection("SACH");
  return await bookCollection.deleteOne({ _id: new ObjectId(id) });
}

module.exports = {
  getAllBook,
  getBookPage,
  created,
  getNewBook,
  getBookById,
  getAllBookByCategoryPage,
  getAllBookByCategory,
  getAllInforBooks,
  addBook,
  updateBook,
  deleteBook,
};
