const { ObjectId } = require("mongodb");
const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB.js");

const EmployeeModel = require("./EmployeeModel.js");
const ReaderModel = require("./ReaderModel");
const TimeCanBorrow = 3 * 24 * 60 * 60 * 1000;

const STATUS_REQUEST = {
  "Đang chờ duyệt": "Đã duyệt",
  "Đã duyệt": "Đã mượn",
  "Đã mượn": "Đã trả",
  "Đã trả": "Đã trả",
};

async function existBorrowRequest(MADOCGIA, MASACH) {
  await connectDB();
  const BookBorrowController = getCollection("THEODOIMUONSACH");
  return await BookBorrowController.findOne({
    MADOCGIA: MADOCGIA,
    MASACH: MASACH,
    TRANGTHAI: { $in: ["Đang chờ duyệt", "Đã duyệt", "Đã mượn"] },
  });
}

async function countBorrowRequest(MADOCGIA) {
  await connectDB();
  const BookBorrowController = getCollection("THEODOIMUONSACH");
  return await BookBorrowController.countDocuments({
    MADOCGIA: MADOCGIA,
    TRANGTHAI: { $in: ["Đang chờ duyệt", "Đã duyệt", "Đã mượn"] },
  });
}

async function createdBorrow(information_borrow) {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  return await BorrowBookCollection.insertOne(information_borrow);
}

async function getAllBorrowRequest() {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  return await BorrowBookCollection.aggregate([
    // Join sang DOCGIA để lấy thông tin độc giả
    {
      $lookup: {
        from: "DOCGIA",
        localField: "MADOCGIA",
        foreignField: "MADOCGIA",
        as: "docgia",
      },
    },
    { $unwind: "$docgia" }, // giải mảng docgia thành object

    // Join sang SACH để lấy thông tin sách
    {
      $lookup: {
        from: "SACH",
        localField: "MASACH",
        foreignField: "MASACH",
        as: "sach",
      },
    },
    { $unwind: "$sach" }, // giải mảng sach thành object

    //NV
    {
      $lookup: {
        from: "NHANVIEN",
        localField: "MASNV",
        foreignField: "MASNV",
        as: "nv",
      },
    },
    { $unwind: { path: "$nv", preserveNullAndEmptyArrays: true } },

    // Chỉ chọn các field cần hiển thị
    {
      $project: {
        _id: 1,
        MADOCGIA: 1,
        TEN_DOCGIA: { $concat: ["$docgia.HOLOT", " ", "$docgia.TEN"] },
        TENSACH: "$sach.TENSACH",
        HOTENNV: "$nv.HoTenNV",
        CREATED: 1,
        TRANGTHAI: 1,
        NGAYMUON: 1,
        NGAYTRA: 1,
      },
    },
  ]).toArray();
}

const getBorrowRequestById = async (id) => {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  return await BorrowBookCollection.findOne({
    _id: new ObjectId(id),
  });
};

function nextStatus(status) {
  return STATUS_REQUEST[status];
}

const updateStatus = async (id, user) => {
  // console.log(user.EMAIL);
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  try {
    const borrow_request = await getBorrowRequestById(id);
    if (!borrow_request) return { message: "Không tìm thấy yêu cầu" };

    if (borrow_request.TRANGTHAI == "Đã duyệt") {
      return await BorrowBookCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            TRANGTHAI: nextStatus(borrow_request.TRANGTHAI),
            NGAYMUON: new Date(),
          },
        }
      );
    } else if (borrow_request.TRANGTHAI == "Đã mượn") {
      // Lấy ngày trả trước khi hết hạn là từ ngày mượn + 3
      const TimePay = new Date(
        borrow_request.NGAYMUON.getTime() + TimeCanBorrow
      );
      const date_pay = new Date();
      if (date_pay > TimePay) {
        return await BorrowBookCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              NGAYTRA: date_pay,
              THUPHAT: 100000,
              TRANGTHAI: "Đã trả muộn",
            },
          }
        );
      } else {
        return await BorrowBookCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              NGAYTRA: date_pay,
              TRANGTHAI: nextStatus(borrow_request.TRANGTHAI),
            },
          }
        );
      }
    } else if (borrow_request.TRANGTHAI == "Đang chờ duyệt") {
      // console.log(user.Email);
      const nv = await EmployeeModel.findEmployee({ Email: user.Email });
      // console.log(user.EMAIL);
      // console.log(nv);
      return await BorrowBookCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            MASNV: nv.MASNV,
            NGAYDUYET: new Date(),
            TRANGTHAI: nextStatus(borrow_request.TRANGTHAI),
          },
        }
      );
    } else {
      return await BorrowBookCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            TRANGTHAI: nextStatus(borrow_request.TRANGTHAI),
          },
        }
      );
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const CancelBorrowRequest = async (id, user) => {
  console.log(user.Email);
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  const employee = await EmployeeModel.findEmployee({ Email: user.Email });
  console.log(employee);
  //Nếu là nhân viên duyệt thì
  if (employee) {
    return BorrowBookCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          MASNV: employee.MASNV,
          LYDOHUY: "Nhân viên đã hủy yêu cầu của bạn",
          TRANGTHAI: "Đã bị hủy",
        },
      }
    );
  } else {
    //Nếu là đọc giả hủy thì khỏi cập nhật mã số nhân viên
    return BorrowBookCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          TRANGTHAI: "Đã bị hủy",
          LYDOHUY: "Bạn đã hủy yêu cầu",
        },
      }
    );
  }
};

async function getAllBorrowRequestReader(user) {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  console.log(user.Email);
  const reader = await ReaderModel.findReader({ EMAIL: user.EMAIL });

  return await BorrowBookCollection.aggregate([
    {
      $match: { MADOCGIA: reader.MADOCGIA },
    },
    // Join sang DOCGIA để lấy thông tin độc giả
    {
      $lookup: {
        from: "DOCGIA",
        localField: "MADOCGIA",
        foreignField: "MADOCGIA",
        as: "docgia",
      },
    },
    { $unwind: "$docgia" }, // giải mảng docgia thành object

    // Join sang SACH để lấy thông tin sách
    {
      $lookup: {
        from: "SACH",
        localField: "MASACH",
        foreignField: "MASACH",
        as: "sach",
      },
    },
    { $unwind: "$sach" }, // giải mảng sach thành object

    //NV
    {
      $lookup: {
        from: "NHANVIEN",
        localField: "MASNV",
        foreignField: "MASNV",
        as: "nv",
      },
    },
    { $unwind: { path: "$nv", preserveNullAndEmptyArrays: true } },

    // Chỉ chọn các field cần hiển thị
    {
      $project: {
        _id: 1,
        MADOCGIA: 1,
        TEN_DOCGIA: { $concat: ["$docgia.HOLOT", " ", "$docgia.TEN"] },
        TENSACH: "$sach.TENSACH",
        HOTENNV: "$nv.HoTenNV",
        CREATED: 1,
        TRANGTHAI: 1,
        NGAYMUON: 1,
        NGAYTRA: 1,
      },
    },
  ]).toArray();
}

async function getTopBorrowBooks() {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");

  return BorrowBookCollection.aggregate([
    {
      $match: {
        TRANGTHAI: { $in: ["Đã mượn", "Đã trả", "Hoàn tất"] },
      },
    },
    {
      $group: {
        _id: "$MASACH",
        MASACH: { $first: "$MASACH" },
        totalBorrowed: { $sum: 1 },
      },
    },
    { $sort: { totalBorrowed: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "SACH",
        localField: "MASACH",
        foreignField: "MASACH",
        as: "book",
      },
    },
    { $unwind: "$book" },
    {
      $project: {
        _id: "$book._id", // lấy _id gốc của sách
        MASACH: 1,
        totalBorrowed: 1,
        TENSACH: "$book.TENSACH",
        URL: "$book.URL",
        // các field khác muốn gửi frontend
      },
    },
  ]).toArray();
}

const countBorrowRequestByBookCode = async (MASACH) => {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");
  return await BorrowBookCollection.countDocuments({
    MASACH,
    TRANGTHAI: { $in: ["Đã duyệt", "Đã mượn", "Đang chờ duyệt"] },
  });
};

async function autoCancelExpiredApproved() {
  await connectDB();
  const BorrowBookCollection = getCollection("THEODOIMUONSACH");

  const fiveDaysAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  return await BorrowBookCollection.updateMany(
    {
      TRANGTHAI: "Đã duyệt",
      NGAYDUYET: { $lte: fiveDaysAgo },
    },
    {
      $set: {
        TRANGTHAI: "Đã bị hủy",
        LYDOHUY: "Quá hạn 5 ngày không đến nhận",
      },
    }
  );
}

module.exports = {
  createdBorrow,
  getAllBorrowRequest,
  updateStatus,
  existBorrowRequest,
  countBorrowRequest,
  CancelBorrowRequest,
  getAllBorrowRequestReader,
  getTopBorrowBooks,
  countBorrowRequestByBookCode,
  autoCancelExpiredApproved,
};
