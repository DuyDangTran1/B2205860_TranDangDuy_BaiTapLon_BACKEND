const BookModel = require("../Model/BookModel");
const CategoriesModel = require("../Model/CategoriesModel");
const ProducerModel = require("../Model/ProducerModel");
const BookBorrowingModel = require("../Model/BookBorrowingModel");
const CountModel = require("../Model/CountModel");
const getAllBook = async (req, res) => {
  try {
    const books = await BookModel.getAllBook();
    return res.status(200).json({ books: books });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const loadDataHomePage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const allBook = await BookModel.getAllBook();
    const bookPage = await BookModel.getBookPage(page, limit);
    const newBook = await BookModel.getNewBook();
    const favoriteBook = await BookBorrowingModel.getTopBorrowBooks();
    return res.status(200).json({
      countPage: Math.ceil(parseInt(allBook.length) / limit),
      page,
      bookPage,
      newBook,
      favoriteBook,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error Server" });
  }
};

const getBookId = async (req, res) => {
  try {
    const id = req.params.id;
    const book = await BookModel.getBookById(id);
    const countBookBorrow =
      await BookBorrowingModel.countBorrowRequestByBookCode(book.MASACH);
    if (!book) return res.status(400).json({ message: "Không tìm thấy" });
    const category = await CategoriesModel.findCategory({ MATL: book.MATL });
    const producer = await ProducerModel.findProducer({ MANXB: book.MANXB });
    // console.log(producer);
    book.SOQUYEN = book.SOQUYEN - countBookBorrow;
    return res.json({
      book: book,
      TENTHELOAI: category?.TENTHELOAI || "Không rõ",
      TENNHAXB: producer?.TENNHAXB || "Không rõ",
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getBookCategory = async (req, res) => {
  try {
    const name_array = req.params.name.split("-");
    name_array[0] =
      name_array[0].charAt(0).toUpperCase() + name_array[0].slice(1);
    const name = name_array.join(" ");
    // console.log(name);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const category = await CategoriesModel.findCategoryByName(name);

    if (!category || !category.MATL) {
      return res.status(400).json({ message: "Không tìm thấy thể loại" });
    }

    const CategoryAllBook = await BookModel.getAllBookByCategory(category.MATL);

    const CategoryBook = await BookModel.getAllBookByCategoryPage(
      category.MATL,
      page,
      limit
    );
    return res.status(200).json({
      CategoryBook: CategoryBook,
      CategoryName: category.TENTHELOAI,
      countPage: Math.ceil(parseInt(CategoryAllBook.length) / limit),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllInforBooks = async (req, res) => {
  try {
    const books = await BookModel.getAllInforBooks();
    // console.log(books);
    res.status(200).json({ books: books });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const fs = require("fs");
const path = require("path");

const insertBook = async (req, res) => {
  try {
    const book = JSON.parse(req.body.book);

    // Tạo mã sách
    let count = await CountModel.getCountCollection({ collection: "SACH" });
    const MASACH = "MS" + count.count;

    // Xử lý ảnh
    let imgPath = "";
    if (req.file) {
      const folderPath = path.join(__dirname, "../public/books");
      if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath, { recursive: true });

      const ext = path.extname(req.file.originalname);
      const fileName = `${MASACH}_${Date.now()}${ext}`;
      const fullPath = path.join(folderPath, fileName);

      fs.writeFileSync(fullPath, req.file.buffer);
      imgPath = `http://localhost:3000/books/${fileName}`;
    } else if (book.URL) {
      imgPath = book.URL;
    }

    const newBook = {
      MASACH,
      TENSACH: book.TENSACH || "",
      TACGIA: book.TACGIA || "",
      DONGIA: parseInt(book.DONGIA) || 0,
      SOQUYEN: parseInt(book.SOQUYEN) || 0,
      NAMXUATBAN: parseInt(book.NAMXUATBAN) || 2000,
      MANXB: book.MANXB || "",
      MATL: book.MATL || "",
      URL: imgPath,
      MOTA: {
        GIOITHIEU: book.MOTA?.GIOITHIEU || "",
        NOIDUNG: book.MOTA?.NOIDUNG || "",
        THONGDIEP: book.MOTA?.THONGDIEP || "",
      },
      CREATED: new Date(),
    };

    await BookModel.addBook(newBook);
    await CountModel.updateCountCollection("SACH", count.count + 1);

    return res.status(200).json({
      message: "Thêm sách thành công",
      book: newBook,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi server", error: error.message });
  }
};

const updateBook = async (req, res) => {
  try {
    const id = req.params.id;

    // parse JSON vì frontend gửi book dạng text
    const body = JSON.parse(req.body.book);

    const file = req.file;
    let newURL = body.URL; // mặc định giữ URL cũ nếu không upload

    // Nếu có upload file mới
    if (file) {
      const fileName = `${body.MASACH}_${Date.now()}.jpg`;
      const filePath = path.join("public/books", fileName);

      fs.writeFileSync(filePath, file.buffer);
      newURL = `http://localhost:3000/books/${fileName}`;
    }

    const dataUpdate = {
      TENSACH: body.TENSACH,
      TACGIA: body.TACGIA,
      MANXB: body.MANXB,
      MATL: body.MATL,
      DONGIA: Number(body.DONGIA),
      SOQUYEN: Number(body.SOQUYEN),
      NAMXUATBAN: Number(body.NAMXUATBAN),
      MOTA: body.MOTA,
      URL: newURL,
    };

    console.log(id, dataUpdate);
    await BookModel.updateBook(id, dataUpdate);

    return res.json({ message: "Cập nhật thành công", URL: newURL });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteBook = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await BookModel.deleteBook(id);

    if (result.deletedCount === 0) {
      return res.status(400).json({ message: "Không tìm thấy sách" });
    }

    return res.status(200).json({ message: "Xóa sách thành công" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  loadDataHomePage,
  getBookId,
  getBookCategory,
  getAllBook,
  getAllInforBooks,
  insertBook,
  updateBook,
  deleteBook,
};
