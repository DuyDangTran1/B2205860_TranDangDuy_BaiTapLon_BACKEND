const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const SECRET = "36eef8456b106cd4408d";
const app = express();
const {
  connectDB,
  getCollection,
} = require("./ConnectMongoDB/ConnectMongoDB.js");
const {
  register,
  login,
  isExistEmail,
  isInformation,
  isExistPhone,
  updateReader,
} = require("./Controller/ReaderController.js");

const BookController = require("./Controller/BooksController.js");

const { refresh } = require("./Controller/SessionController.js");

const {
  insertDocumentToProducer,
  insertManyDocumentToProducer,
} = require("./Model/ProducerModel.js");

const {
  insertCategory,
  insertManyCategories,
} = require("./Model/CategoriesModel.js");

const EmployeeController = require("./Controller/EmployeeController.js");
const SessionController = require("./Controller/SessionController.js");
const categoriesCollection = require("./Controller/CategoriesController.js");
const ReaderController = require("./Controller/ReaderController.js");
const { decode } = require("punycode");

const BookBorrowController = require("./Controller/BookBorrowController.js");

app.use(express.json());

app.use(cookieParser());

app.use(express.static("public"));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use((req, res, next) => {
  if (
    req.path == "/api/login" ||
    req.path == "/api/auth/google" ||
    req.path == "/api/register" ||
    req.path == "/api/refresh" ||
    req.path == "/api/dashboard/login"
  )
    return next();

  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Không có token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token không hợp lệ" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
});

app.get("/", BookController.loadDataHomePage);

app.get("/api/getBookId/:id", BookController.getBookId);

app.get("/api/getAllBook", BookController.getAllBook);

app.post("/api/insertProducer", async (req, res) => {
  try {
    const result = await insertDocumentToProducer(req.body);

    if (
      result == "Dữ liệu không hợp lệ" ||
      result == "Không được truyền vào đối tượng rỗng"
    ) {
      return res.status(402).json({ message: result });
    }

    res.status(200).json({ message: result });
  } catch (error) {
    res.status(500).json({ message: result });
  }
});

app.post("/api/insertManyProducer", async (req, res) => {
  try {
    const result = await insertManyDocumentToProducer(req.body);

    if (
      result == "Dữ liệu truyền vào không hợp lệ" ||
      result == "Các phần tử trong mảng phải là các document"
    ) {
      return res.status(402).json({ message: result });
    }

    res.status(200).json({ message: result });
  } catch (error) {
    return res.status(500).json({ message: result });
  }
});

app.post("/api/insertCategory", async (req, res) => {
  try {
    const result = await insertCategory(req.body);

    if (
      result == "Dữ liệu thêm vào không hợp lệ" ||
      result == "Không được truyền vào đối tượng rỗng"
    ) {
      res.status(402).json({ message: result });
    }

    res.status(200).json({ message: result });
  } catch (error) {
    return res.status(500).json({ message: result });
  }
});

app.post("/api/insertManyCategories", async (req, res) => {
  try {
    const result = await insertManyCategories(req.body);
    if (
      result == "Dữ liệu truyền vào không hợp lệ" ||
      result == "Dữ liệu document bị sai, vui lòng xem lại"
    ) {
      res.status(402).json({ message: result });
    }

    res.status(200).json({ message: result });
  } catch (error) {
    return res.status(500).json({ message: result });
  }
});

app.post("/api/register", register);
app.post("/api/login", login);
app.get("/api/information/reader", ReaderController.informationReader);
app.get("/api/isReader", ReaderController.isReader);
app.post("/api/auth/google", SessionController.logInWithGoogleAccount);
app.post("/api/existEmail", isExistEmail);
app.get("/api/refresh", refresh);
app.get("/api/isInformation", isInformation);
app.post("/api/existPhone", isExistPhone);
app.post("/api/updateInformation", updateReader);
app.get("/api/getallcategories", categoriesCollection.getAllCategories);
app.post("/api/borrow/:id", BookBorrowController.borrowBook);
app.put("/api/cancel/:id", BookBorrowController.CancelRequest);
app.get("/api/reader/borrowHistory", BookBorrowController.getAllRequestReader);
app.delete("/api/logout", SessionController.logOut);
app.get("/api/category/:name", BookController.getBookCategory);
// admin
app.post("/api/dashboard/employeeCreate", EmployeeController.addEmployee);
app.post("/api/dashboard/login", EmployeeController.employeeLogin);
app.get("/api/dashboard/isEmployee", EmployeeController.isEmployee);
app.get("/api/dashboard/pending", BookBorrowController.manageBorrowRequests);
app.put("/api/dashboard/updateState/:id", BookBorrowController.nextState);
app.put(
  "/api/dashboard/autoupdate",
  BookBorrowController.autoCancelExpiredApproved
);

app.listen(3000, function () {
  console.log("Server is listening");
});
