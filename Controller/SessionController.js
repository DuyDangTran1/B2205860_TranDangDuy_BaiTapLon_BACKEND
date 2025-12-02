const SECRET = "36eef8456b106cd4408d";
const jwt = require("jsonwebtoken");
const {
  findSessionByRefresh,
  removeSessionByEmail,
  isExistSession,
  findSessionByEmail,
  createRefreshToken,
} = require("../Model/SessionModel");

const ReaderModel = require("../Model/ReaderModel");
const CountModel = require("../Model/CountModel");

const cookieParser = require("cookie-parser");
const { response } = require("express");
const crypto = require("crypto");

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const session = await findSessionByRefresh(refreshToken);
    // console.log(session);
    // console.log(session && refreshToken === session.refresh_token);
    if (session && refreshToken === session.refresh_token) {
      //Cung cấp accessToken khác
      const accessToken = jwt.sign({ EMAIL: session.email }, SECRET, {
        expiresIn: "1h",
      });

      return res.status(200).json({
        message: "oke",
        accessToken: accessToken,
      });
    }

    return res.status(401).json({ message: "Refresh Token không hợp lệ" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi sever" });
  }
};

const logInWithGoogleAccount = async (req, res) => {
  try {
    if (!req.body.tokenId)
      return res.status(400).json({ message: "Lỗi truyền dữ liệu" });

    const information_user = jwt.decode(req.body.tokenId);

    if (!information_user.email_verified)
      return res.status(400).json({ message: "email chưa xác thực" });

    // Kiểm tra xem email đăng nhập có được lưu trong reader chưa
    // nếu chưa thì tạo mới lưu vào reader
    let accessToken;
    let refreshToken;
    if (!(await ReaderModel.isExist({ EMAIL: information_user.email }))) {
      const countDOCGIA = await CountModel.getCountCollection({
        collection: "DOCGIA",
      });
      const reader_code = "DG" + countDOCGIA.count;
      await ReaderModel.createReader({
        MADOCGIA: reader_code,
        TEN: information_user.given_name,
        HOLOT: information_user.family_name,
        EMAIL: information_user.email,
      });

      await CountModel.updateCountCollection("DOCGIA", ++countDOCGIA.count);
    }

    //tạo accesstoken và refreshToken gửi về client
    if (await isExistSession(information_user.email)) {
      //Cung cấp accessToken khác
      accessToken = jwt.sign({ EMAIL: information_user.email }, SECRET, {
        expiresIn: "1h",
      });

      //Lấy refresh token ra
      const session = await findSessionByEmail(information_user.email);
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
      accessToken = jwt.sign({ EMAIL: information_user.email }, SECRET, {
        expiresIn: "1h",
      });

      // Tạo 1 Refresh token gửi cho người dùng lưu vào cookie và gửi accesstoken lưu vào storage
      refreshToken = crypto.randomBytes(40).toString("hex");

      await createRefreshToken({
        refresh_token: refreshToken,
        email: information_user.email,
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
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

const logOut = async (req, res) => {
  try {
    await removeSessionByEmail(req.user);
    res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    console(error);
    res.status(500).json({ message: "Đăng xuất thất bại" });
  }
};

module.exports = {
  refresh,
  logOut,
  logInWithGoogleAccount,
};
