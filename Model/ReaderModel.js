const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB");

const createReader = async (reader) => {
  await connectDB();
  const readerCollection = await getCollection("DOCGIA");
  return await readerCollection.insertOne(reader);
};

const findReader = async (reader) => {
  await connectDB();
  const readerCollection = await getCollection("DOCGIA");
  return await readerCollection.findOne(reader);
};

const isExist = async (field) => {
  try {
    await connectDB();
    const readerCollection = await getCollection("DOCGIA");
    const result = await readerCollection.findOne(field);
    if (!result) return false;
    else return true;
  } catch (error) {
    return false;
  }
};
const updateInformationReader = async (email, information) => {
  await connectDB();
  const readerCollection = await getCollection("DOCGIA");
  return await readerCollection.updateOne(
    { EMAIL: email }, // điều kiện tìm độc giả
    {
      $set: {
        HOLOT: information.HOLOT,
        TEN: information.TEN,
        NGAYSINH: new Date(information.NGAYSINH),
        PHAI: information.PHAI,
        DIACHI: information.DIACHI,
        DIENTHOAI: information.DIENTHOAI,
        isInfor: true,
      },
    },
    { bypassDocumentValidation: true }
  );
};

module.exports = {
  createReader,
  isExist,
  findReader,
  updateInformationReader,
};
