const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const {
  createReader,
  isExist,
  findReader,
  updateInformationReader,
} = require("../Model/ReaderModel.js");
const {
  getCountCollection,
  updateCountCollection,
} = require("../Model/CountModel.js");
const {
  createRefreshToken,
  isExistSession,
  findSessionByEmail,
} = require("../Model/SessionModel.js");
const { error } = require("console");

const phone_regex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const password_regex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

const collection = "DOCGIA";
const SECRET = "36eef8456b106cd4408d";

//Hàm xử lý đăng kí
//họ, tên, Cần Email, Password , Tên , Họ lót không bắt buộc

const isExistEmail = async (req, res) => {
  try {
    if (!req.body.EMAIL)
      return res.status(400).json({ err_data: "Lỗi truyền dữ liệu" });

    if (await isExist({ EMAIL: req.body.EMAIL }))
      return res.status(200).json({ result_find: "Email đã tồn tại" });

    return res.status(200).json({ result_find: "Email không tồn tại" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const informationReader = async (req, res) => {
  try {
    const information = await findReader({ EMAIL: req.user.EMAIL });
    if (!information)
      return res.status(400).json({ message: "Đọc giả không tồn tại" });

    return res.status(200).json({
      information: {
        HOLOT: information.HOLOT,
        TEN: information.TEN,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const register = async (req, res) => {
  try {
    //Kiểm tra dữ liệu req truyền vào
    if (
      !req.body.EMAIL ||
      typeof req.body.EMAIL !== "string" ||
      !email_regex.test(req.body.EMAIL) ||
      !req.body.PASSWORD ||
      typeof req.body.PASSWORD !== "string" ||
      !password_regex.test(req.body.PASSWORD)
    ) {
      return res.status(400).json({ error_data: "Lỗi dữ liệu không hợp lệ" });
    }

    // Kiểm tra email đã tồn tại hay chưa
    if (await isExist({ EMAIL: req.body.EMAIL }))
      return res.status(402).json({ err_email: "Email đã tồn tại" });

    // Tạo đối tượng new_reader
    const new_reader = {
      EMAIL: req.body.EMAIL,
      CREATED: new Date(),
      isInfor: false,
    };

    // Hash pass
    new_reader.HASHPASSWORD = await bcrypt.hash(req.body.PASSWORD, 10);

    //Xử lý MADOCGIA
    const countDOCGIA = await getCountCollection({ collection: collection });
    const reader_code = "DG" + countDOCGIA.count;
    new_reader.MADOCGIA = reader_code;

    await createReader(new_reader);
    await updateCountCollection("DOCGIA", ++countDOCGIA.count);
    return res.status(200).json({ message: "Đăng kí thành công" });
  } catch (error) {
    console.error("Lỗi chi tiết:", error);
    return res.status(500).json({ message: "Lỗi bên server" });
  }
};

const login = async (req, res) => {
  try {
    // console.log("........" + req.body.EMAIL);
    //Kiểm tra thông tin bên client
    if (
      !req.body.EMAIL ||
      typeof req.body.EMAIL !== "string" ||
      !req.body.PASSWORD ||
      typeof req.body.PASSWORD !== "string"
    ) {
      return res.status(400).json({ err_account: "Lỗi truyền dữ liệu" });
    }
    //Hash mật khẩu bên client
    const reader = await findReader({ EMAIL: req.body.EMAIL });
    let accessToken = "";
    let refreshToken = "";

    if (
      reader &&
      (await bcrypt.compare(req.body.PASSWORD, reader.HASHPASSWORD))
    ) {
      if (await isExistSession(req.body.EMAIL)) {
        //Cung cấp accessToken khác
        accessToken = jwt.sign({ EMAIL: req.body.EMAIL }, SECRET, {
          expiresIn: "1h",
        });

        //Lấy refresh token ra
        const session = await findSessionByEmail(req.body.EMAIL);
        refreshToken = session?.refresh_token;
        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 14 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
          message_account: "Đăng nhập thành công",
          accessToken: accessToken,
        });
      } else {
        // Cung cấp 1 access token
        accessToken = jwt.sign({ EMAIL: req.body.EMAIL }, SECRET, {
          expiresIn: "1h",
        });

        // Tạo 1 Refresh token gửi cho người dùng lưu vào cookie và gửi accesstoken lưu vào storage
        refreshToken = crypto.randomBytes(40).toString("hex");

        await createRefreshToken({
          refresh_token: refreshToken,
          email: req.body.EMAIL,
          createAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          path: "/",
        });

        //gửi refresh về qua cookie
        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 14 * 24 * 60 * 60 * 1000,
          path: "/",
        });
        return res.status(200).json({
          message_account: "Đăng nhập thành công",
          accessToken: accessToken,
        });
      }
    }

    return res
      .status(400)
      .json({ err_account: "Email hoặc mật khẩu không đúng" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const isInformation = async (req, res) => {
  try {
    const email = req.user.EMAIL;
    const reader = await findReader({ EMAIL: email });
    if (!reader)
      return res.status(400).json({ message: "Không tìm thấy", isInfor: "" });

    return res.status(200).json({ isInfor: reader.isInfor });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi Server", isInfor: "" });
  }
};

const isExistPhone = async (req, res) => {
  try {
    const phone = req.body.DIENTHOAI;
    if (!phone) return res.status(400).json({ message: "Lỗi truyền dữ liệu" });

    const reader = await findReader({ PHONE: phone });
    if (reader)
      return res.status(400).json({ message: "Số điện thoại đã tồn tại" });

    return res.status(200).json({ message: "Số điện thoại chưa có" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

const updateReader = async (req, res) => {
  if (
    !req.body.TEN ||
    !req.body.NGAYSINH ||
    !req.body.PHAI ||
    !req.body.DIACHI ||
    !req.body.DIENTHOAI ||
    !phone_regex.test(req.body.DIENTHOAI)
  ) {
    return res.status(400).json({ message: "Lỗi truyền dữ liệu" });
  }

  try {
    await updateInformationReader(req.user.EMAIL, {
      HOLOT: req.body.HOLOT || "",
      TEN: req.body.TEN,
      NGAYSINH: req.body.NGAYSINH,
      PHAI: req.body.PHAI,
      DIACHI: req.body.DIACHI,
      DIENTHOAI: req.body.DIENTHOAI,
    });

    return res.status(200).json({ message: "Cập nhật thông tin thành công" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

module.exports = {
  register,
  login,
  isExistEmail,
  isInformation,
  isExistPhone,
  updateReader,
  informationReader,
};


