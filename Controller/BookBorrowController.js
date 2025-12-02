const { response } = require("express");
const BookBorrowingModel = require("../Model/BookBorrowingModel");
const BookModel = require("../Model/BookModel");
const Reader = require("../Model/ReaderModel");

const borrowBook = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) return res.status(400).json({ message: "Lỗi dữ liệu" });
    const reader_code = (await Reader.findReader({ EMAIL: req.user.EMAIL }))
      .MADOCGIA;
    const count = await BookBorrowingModel.countBorrowRequest(reader_code);
    console.log(count);
    if (count > 2) {
      return res.status(400).json({
        message: "Bạn đã mượn hoặc đang yêu cầu mượn quá 3 quyển sách",
      });
    }

    const book_code = (await BookModel.getBookById(id)).MASACH;

    if (await BookBorrowingModel.existBorrowRequest(reader_code, book_code))
      return res
        .status(400)
        .json({ message: "Bạn đang mượn hoặc đang chờ duyệt quyển sách này" });
    // console.log(reader_code);
    await BookBorrowingModel.createdBorrow({
      MADOCGIA: reader_code,
      MASACH: book_code,
      TRANGTHAI: "Đang chờ duyệt",
      CREATED: new Date(),
      NGAYMUON: null,
      NGAYTRA: null,
      MASNV: null,
    });

    res.status(200).json({ message: "Đã thêm vào danh sách chờ duyệt" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const manageBorrowRequests = async (req, res) => {
  try {
    const borrow_requests = await BookBorrowingModel.getAllBorrowRequest();
    res.status(200).json({ borrow_requests: borrow_requests });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

const nextState = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(req.user);
    const result = await BookBorrowingModel.updateStatus(id, req.user);
    if (result.message)
      return res.status(400).json({ message: "Không tìm thấy yêu cầu" });

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const CancelRequest = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Lỗi truyền dữ liệu" });

    await BookBorrowingModel.CancelBorrowRequest(id, req.user);

    return res.status(200).json({ message: "Hủy mượn sách thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
    // console.log(error);
  }
};

const getAllRequestReader = async (req, res) => {
  try {
    const borrow_requests_reader =
      await BookBorrowingModel.getAllBorrowRequestReader(req.user);
    return res.status(200).json({ borrow_requests: borrow_requests_reader });
  } catch (error) {
    console.log(error);
    res.status(500).json("Lỗi server");
  }
};

module.exports = {
  borrowBook,
  manageBorrowRequests,
  nextState,
  CancelRequest,
  getAllRequestReader,
};
