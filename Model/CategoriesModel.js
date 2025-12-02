const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB");

const insertCategory = async (category) => {
  try {
    if (!category || Array.isArray(category) || typeof category != "object") {
      return "Dữ liệu thêm vào không hợp lệ";
    }

    if (Object.keys(category).length == 0) {
      return "Không được truyền vào đối tượng rỗng";
    }

    await connectDB();
    const categoriesCollection = await getCollection("THELOAISACH");
    await categoriesCollection.insertOne(category);
    return "Thêm document thành công";
  } catch (error) {
    return "Lỗi thêm document vào collection";
  }
};

const insertManyCategories = async (categories) => {
  try {
    if (
      !categories ||
      typeof categories != "object" ||
      !Array.isArray(categories)
    ) {
      return "Dữ liệu truyền vào không hợp lệ";
    }

    const allValidCategories = categories.every((category) => {
      return (
        category &&
        !Array.isArray(category) &&
        Object.keys(category).length != 0 &&
        typeof category == "object"
      );
    });

    if (!allValidCategories) {
      return "Dữ liệu document bị sai, vui lòng xem lại";
    }

    await connectDB();
    const categoriesCollection = await getCollection("THELOAISACH");
    await categoriesCollection.insertMany(categories);
    return "Thêm các document thành công";
  } catch (error) {
    return "Lỗi trong quá trình thêm dữ liệu";
  }
};

const findCategory = async (MATL) => {
  await connectDB();
  const categoriesCollection = await getCollection("THELOAISACH");
  return await categoriesCollection.findOne(MATL);
};

const findCategoryByName = async (name) => {
  await connectDB();
  const categoriesCollection = await getCollection("THELOAISACH");
  return await categoriesCollection.findOne({ TENTHELOAI: name });
};

const getAllCategories = async () => {
  await connectDB();
  const categoriesCollection = await getCollection("THELOAISACH");
  return await categoriesCollection.find().toArray();
};

module.exports = {
  insertCategory,
  insertManyCategories,
  findCategory,
  getAllCategories,
  findCategoryByName,
};
