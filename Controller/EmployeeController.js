const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const EmployeeModel = require("../Model/EmployeeModel");
const CountModel = require("../Model/CountModel");
const SessionModel = require("../Model/SessionModel");
const Collection = "NHANVIEN";

const email_regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const password_regex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
const phone_regex = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

const SECRET = "36eef8456b106cd4408d";
const saltRounds = 10;

const addEmployee = async (req, res) => {
  try {
    // Kiểm tra thông tin truyền vào
    if (
      !req.body.HoTenNV ||
      typeof req.body.HoTenNV != "string" ||
      !req.body.Email ||
      !email_regex.test(req.body.Email) ||
      !req.body.Password ||
      !password_regex.test(req.body.Password) ||
      !req.body.ChucVu ||
      typeof req.body.ChucVu != "string" ||
      !req.body.DiaChi ||
      typeof req.body.DiaChi != "string" ||
      !req.body.SoDienThoai ||
      !phone_regex.test(req.body.SoDienThoai)
    ) {
      return res.status(400).json({ message: "Lỗi dữ liệu" });
    }

    if (await EmployeeModel.findEmployee({ Email: req.body.Email }))
      return res.status(409).json({ message: "Email đã tồn tại" });

    if (await EmployeeModel.findEmployee({ SoDienThoai: req.body.SoDienThoai }))
      return res.status(409).json({ message: "Số điện thoại đã tồn tại" });

    let count_nv = await CountModel.getCountCollection({
      collection: Collection,
    });
    const hash_password = await bcrypt.hash(req.body.Password, saltRounds);

    const masnv = "NV" + count_nv.count;
    const new_nv = {
      MASNV: masnv,
      HoTenNV: req.body.HoTenNV,
      Email: req.body.Email,
      Password: hash_password,
      ChucVu: req.body.ChucVu,
      DiaChi: req.body.DiaChi,
      SoDienThoai: req.body.SoDienThoai,
    };

    await CountModel.updateCountCollection(Collection, ++count_nv.count);
    await EmployeeModel.insertEmployee(new_nv);

    res.status(200).json({ message: "Thêm nhân viên thành công" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const employeeLogin = async (req, res) => {
  try {
    //Kiểm tra thông tin bên client
    if (
      !req.body.Email ||
      typeof req.body.Email !== "string" ||
      !req.body.Password ||
      typeof req.body.Password !== "string"
    ) {
      return res.status(400).json({ message: "Lỗi truyền dữ liệu" });
    }
    //Hash mật khẩu bên client
    const employee = await EmployeeModel.findEmployee({
      Email: req.body.Email,
    });
    let accessToken = "";
    let refreshToken = "";

    if (
      employee &&
      (await bcrypt.compare(req.body.Password, employee.Password))
    ) {
      if (await SessionModel.isExistSession(req.body.Email)) {
        //Cung cấp accessToken khác
        accessToken = jwt.sign({ Email: req.body.Email }, SECRET, {
          expiresIn: "1h",
        });

        //Lấy refresh token ra
        const session = await SessionModel.findSessionByEmail(req.body.Email);
        refreshToken = session?.refresh_token;
        res.cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 14 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
          message: "Đăng nhập thành công",
          accessToken: accessToken,
        });
      } else {
        // Cung cấp 1 access token
        accessToken = jwt.sign({ Email: req.body.Email }, SECRET, {
          expiresIn: "1h",
        });

        // Tạo 1 Refresh token gửi cho người dùng lưu vào cookie và gửi accesstoken lưu vào storage
        refreshToken = crypto.randomBytes(40).toString("hex");

        await SessionModel.createRefreshToken({
          refresh_token: refreshToken,
          email: req.body.Email,
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
          message: "Đăng nhập thành công",
          accessToken: accessToken,
        });
      }
    }

    return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addEmployee,
  employeeLogin,
};
