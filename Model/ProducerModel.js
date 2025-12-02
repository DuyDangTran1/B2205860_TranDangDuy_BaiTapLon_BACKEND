const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB");

async function insertDocumentToProducer(producer) {
  try {
    if (!producer || typeof producer !== "object" || Array.isArray(producer)) {
      return "Dữ liệu không hợp lệ";
    }

    if (Object.keys(producer).length === 0) {
      return "Không được truyền vào đối tượng rỗng";
    }

    await connectDB();
    const producerCollection = await getCollection("NHAXUATBAN");
    await producerCollection.insertOne(producer);
    return "Thêm sản phẩm thành công";
  } catch (err) {
    return "Lỗi khi thêm document";
  }
}

async function insertManyDocumentToProducer(producers) {
  try {
    if (
      !producers ||
      typeof producers !== "object" ||
      producers.length == 0 ||
      !Array.isArray(producers)
    ) {
      return "Dữ liệu truyền vào không hợp lệ";
    }

    const areAllValidObjects = producers.every(
      (producer) =>
        producer && typeof producer === "object" && !Array.isArray(producer)
    );

    if (!areAllValidObjects) {
      return "Các phần tử trong mảng phải là các document";
    }

    await connectDB();
    const producerCollection = await getCollection("NHAXUATBAN");
    await producerCollection.insertMany(producers);
    return "Thêm sản phẩm thành công";
  } catch (err) {
    return "Lỗi khi thêm document";
  }
}

const findProducer = async (MANXB) => {
  await connectDB();
  const producerCollection = await getCollection("NHAXUATBAN");
  return await producerCollection.findOne(MANXB);
};

module.exports = {
  insertDocumentToProducer,
  insertManyDocumentToProducer,
  findProducer,
};
