const BookModel = require("../Model/BookModel");
const CategoriesModel = require("../Model/CategoriesModel");
const ProducerModel = require("../Model/ProducerModel");
const BookBorrowingModel = require("../Model/BookBorrowingModel");

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
    console.log(name);
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

module.exports = {
  loadDataHomePage,
  getBookId,
  getBookCategory,
  getAllBook,
};
