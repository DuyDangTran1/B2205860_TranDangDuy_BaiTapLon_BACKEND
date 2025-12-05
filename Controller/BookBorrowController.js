const { response } = require("express");
const BookBorrowingModel = require("../Model/BookBorrowingModel");
const BookModel = require("../Model/BookModel");
const Reader = require("../Model/ReaderModel");

const borrowBook = async (req, res) => {
  const sendEmail = require("../utils/email");
  const id = req.params.id;
  try {
    if (!id) return res.status(400).json({ message: "Lỗi dữ liệu" });
    const reader = await Reader.findReader({ EMAIL: req.user.EMAIL });
    const reader_code = reader.MADOCGIA;
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
    await sendEmail(
      reader.EMAIL,
      "Cập nhật trạng thái mượn sách",
      `<h3>Thư viện DD thông báo</h3>
       <p>Yêu cầu mượn sách của bạn đang chờ được duyệt</p>`
    );
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
  const sendEmail = require("../utils/email");

  try {
    const id = req.params.id;

    const result = await BookBorrowingModel.updateStatus(id, req.user);
    if (result.message)
      return res.status(400).json({ message: "Không tìm thấy yêu cầu" });

    // Lấy thông tin mượn để gửi email
    const requestInfo = await BookBorrowingModel.getBorrowRequestById(id);
    const statusNow = requestInfo.TRANGTHAI;

    // Lấy email độc giả
    const reader = await Reader.findReader({ MADOCGIA: requestInfo.MADOCGIA });

    // Gửi email
    if (statusNow == "Đã duyệt") {
      await sendEmail(
        reader.EMAIL,
        "Cập nhật trạng thái mượn sách",
        `<h3>Thư viện DD thông báo</h3>
       <p>Yêu cầu mượn sách của bạn đã đã được duyệt</p>`
      );
    } else if (statusNow == "Đã mượn") {
      await sendEmail(
        reader.EMAIL,
        "Cập nhật trạng thái mượn sách",
        `<h3>Thư viện DD thông báo</h3>
       <p>Bạn đã lấy sách vào lúc ${
         requestInfo.NGAYMUON ? requestInfo.NGAYMUON.toLocaleString() : ""
       } vui lòng trả sách trước 7 ngày sau. Nếu trả sách trễ sẽ bị phạt 100K</p>`
      );
    } else if (statusNow == "Đã trả") {
      await sendEmail(
        reader.EMAIL,
        "Cập nhật trạng thái mượn sách",
        `<h3>Thư viện DD</h3>
       <p>hẹn gặp bạn vào lần tới</p>`
      );
    } else {
      await sendEmail(
        reader.EMAIL,
        "Cập nhật trạng thái mượn sách",
        `<h3>Thư viện DD xin thông báo</h3>
       <p>bạn đã trả trễ sách, bị phạt 100k</p>`
      );
    }

    return res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const CancelRequest = async (req, res) => {
  try {
    const sendEmail = require("../utils/email");
    const id = req.params.id;
    const requestInfo = await BookBorrowingModel.getBorrowRequestById(id);
    const reader = await Reader.findReader({ MADOCGIA: requestInfo.MADOCGIA });
    const employee_email = req.user.Email;
    if (!id) return res.status(400).json({ message: "Lỗi truyền dữ liệu" });

    await BookBorrowingModel.CancelBorrowRequest(id, req.user);
    if (employee_email) {
      await sendEmail(
        reader.EMAIL,
        "Cập nhật trạng thái mượn sách",
        `<h3>Thư viện DD xin thông báo</h3>
       <p>yêu cầu của bạn đã nhân viên hủy vui long liên hệ với nhân viên để biết thêm thông tin</p>`
      );
    } else {
      await sendEmail(
        reader.EMAIL,
        "Cập nhật trạng thái mượn sách",
        `<h3>Thư viện DD xin thông báo</h3>
       <p>Bạn đã hủy yêu cầu mượn sách thành công</p>`
      );
    }
    return res.status(200).json({ message: "Hủy mượn sách thành công" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
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

const autoCancelExpiredApproved = async () => {
  try {
    const sendEmail = require("../utils/email");
    const expiredRequests =
      await BookBorrowingModel.autoCancelExpiredApproved();

    for (let req of expiredRequests) {
      const reader = await Reader.findReader({ MADOCGIA: req.MADOCGIA });
      if (reader) {
        await sendEmail(
          reader.EMAIL,
          "Cập nhật trạng thái mượn sách",
          `<h3>Thư viện DD xin thông báo</h3>
           <p>Yêu cầu mượn sách của bạn đã bị hủy do không đến lấy sách quá 5 ngày</p>`
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const getStatistics = async (req, res) => {
  try {
    const stats = await BookBorrowingModel.getStatisticsByMonth();
    console.log(stats);
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  borrowBook,
  manageBorrowRequests,
  nextState,
  CancelRequest,
  getAllRequestReader,
  autoCancelExpiredApproved,
  getStatistics,
};
