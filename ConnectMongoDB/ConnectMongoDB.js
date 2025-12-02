const { MongoClient, Timestamp } = require("mongodb");

const DATABASE_NAME = "QuanLyMuonSach";
const MONGO_URI = `mongodb://127.0.0.1:27017/${DATABASE_NAME}`;

let client;
let db = null;

async function connectDB() {
  if (!client) {
    client = new MongoClient(MONGO_URI, { maxPoolSize: 10 }); 
    await client.connect();
    db = client.db(DATABASE_NAME);
  }
  return db;
}

function getCollection(name) {
  if (!db) throw new Error("Errol 500");
  return db.collection(name);
}
//
async function createCollectionNV() {
  try {
    await connectDB();
    const collections = await db.listCollections({ name: "NHANVIEN" }).toArray();
    if (collections.length > 0) {
      await db.collection("NHANVIEN").drop();
      console.log("Đã xóa collection NHANVIEN cũ.");
    }

    await db.createCollection("NHANVIEN", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "_id",
            "MASNV",
            "HoTenNV",
            "Email",
            "Password",
            "ChucVu",
            "DiaChi",
            "SoDienThoai",
          ],
          properties: {
            _id: { bsonType: "objectId" },
            MASNV: {
              bsonType: "string",
              description: "Mã số nhân viên duy nhất",
            },
            HoTenNV: {
              bsonType: "string",
              description: "Họ và tên nhân viên",
            },
            Email:{
              bsonType: "string",
              description: "Email của nhân viên là duy nhất"
            },
            Password: {
              bsonType: "string",
              description: "Mật khẩu của nhân viên",
            },
            ChucVu: {
              bsonType: "string",
              description: "Chức vụ của nhân viên",
            },
            DiaChi: {
              bsonType: "string",
              description: "Địa chỉ nhân viên",
            },
            SoDienThoai: {
              bsonType: "string",
              description: "Số điện thoại nhân viên",
            },
          },
        },
      },
    });
    await getCollection("NHANVIEN").createIndex({ MASNV: 1 }, { unique: true });
    await getCollection("NHANVIEN").createIndex({ Email: 1 }, { unique: true });

    console.log("Collection NHANVIEN được tạo thành công!");
  } catch (err) {
    console.error("Error:", err);
  }
}

//Create collection DOCGIA
async function createCollectionDOCGIA() {
  try {
    await connectDB();
    const collections = await db.listCollections({ name: "DOCGIA" }).toArray();
    if (collections.length > 0) {
      await db.collection("DOCGIA").drop();
      console.log("Đã xóa collection DOCGIA cũ.");
    }

    await db.createCollection("DOCGIA", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "_id",
            "MADOCGIA",
            "HOLOT",
            "TEN",
            "NGAYSINH",
            "PHAI",
            "DIACHI",
            "EMAIL",
            "HASHPASSWORD",
          ],
          properties: {
            _id: { bsonType: "objectId" },
            MADOCGIA: {
              bsonType: "string",
              description: "Mã đọc giả duy nhất",
            },
            HOLOT: {
              bsonType: "string",
              description: "Họ của đọc giả",
            },
            TEN: {
              bsonType: "string",
              description: "Tên của đọc giả",
            },
            NGAYSINH: {
              bsonType: "date",
              description: "Ngày tháng năm sinh của đọc giả",
            },
            PHAI: {
              bsonType: "string",
              description: "Giới tính của độc giả (Nam/Nữ)"
            },
            DIACHI: {
              bsonType: "string",
              description: "Địa chỉ đọc giả",
            },
            DIENTHOAI: {
              bsonType: "string",
              description: "Số điện thoại đọc giả",
            },
            EMAIL: {
              bsonType: "string",
              description: "Email của dọc giả là duy nhất"
            },
            HASHPASSWORD: {
              bsonType: "string",
              description: "Password của đọc giả là duy nhất "
            },
            CREATED: {
              bsonType: Timestamp,
              description: "Thời gian tạo"
            }
          },
        },
      },
    });
    await getCollection("DOCGIA").createIndex({ MADOCGIA: 1 }, { unique: true });
    await getCollection("DOCGIA").createIndex({ EMAIL: 1 }, { unique: true });
    await getCollection("DOCGIA").createIndex({ DIENTHOAI: 1 }, { unique: true });

    console.log("Collection DOCGIA được tạo thành công!");
  } catch (err) {
    console.error("Error:", err);
  } 
}

//Create collection THEODOIMUONSACH
async function createCollectionTHEODOIMUONSACH() {
  try {
    await connectDB();
    const collections = await db.listCollections({ name: "THEODOIMUONSACH" }).toArray();
    if (collections.length > 0) {
      await db.collection("THEODOIMUONSACH").drop();
      console.log("Đã xóa collection THEODOIMUONSACH cũ.");
    }

    await db.createCollection("THEODOIMUONSACH", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "_id",
            "MADOCGIA",
            "MASACH",
            "TRANGTHAI"
          ],
          properties: {
            _id: { bsonType: "objectId" },
            MADOCGIA: {
              bsonType: "string",
              description: "Mã đọc giả",
            },
            NGAYMUON: {
              bsonType: "date",
              description: "Ngày mượn",
            },
            NGAYTRA: {
              bsonType: "date",
              description: "Ngày trả",
            },
            MASACH: {
              bsonType: "string",
              description: "Mã sách",
            },
            MSNV: {
              bsonType: "string",
              description: "Mã số nhân viên",
            },
            TRANGTHAI: {
              bsonType: "string",
              description: "Trạng thái mượn sách",
            }
          },
        },
      },
    });

    console.log("Collection THEODOIMUONSACH được tạo thành công!");
  } catch (err) {
    console.error("Error:", err);
  }
}


//Nhà xuất bản
async function createCollectionNHAXUATBAN() {
  try {
    await connectDB();
    const collections = await db.listCollections({ name: "NHAXUATBAN" }).toArray();
    if (collections.length > 0) {
      await db.collection("NHAXUATBAN").drop();
      console.log("Đã xóa collection NHAXUATBAN cũ.");
    }

    await db.createCollection("NHAXUATBAN", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "_id",
            "MANXB",
            "DIACHI",
            "TENNHAXB"
          ],
          properties: {
            _id: { bsonType: "objectId" },
            MANXB: {
              bsonType: "string",
              description: "Mã nhà xuất bản",
            },
            DIACHI: {
              bsonType: "string",
              description: "Địa chỉ của nhà xuất bản",
            },
            TENNHAXB: {
              bsonType: "string",
              description: "Tên của nhà xuất bản",
            }
          },
        },
      },
    });
    await getCollection("NHAXUATBAN").createIndex({ MANXB: 1 }, { unique: true });
    console.log("Collection NHAXUATBAN được tạo thành công!");
  } catch (err) {
    console.error("Error:", err);
  }
}

/*
//Đã chạy tạo collection
// (async () => {
//   await createCollectionTHEODOIMUONSACH();
//   await createCollectionDOCGIA();
//   await createCollectionNV();
//   if (client) await client.close();
// })();
*/
module.exports = {connectDB, getCollection};