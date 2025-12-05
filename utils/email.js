const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tuechst1@gmail.com",
    pass: "qqwn iixu mpvc unhq",
  },
});

async function sendEmail(to, subject, html) {
  return transporter.sendMail({
    from: '"Thư viện DD" <tuechst1@gmail.com>',
    to,
    subject,
    html,
  });
}

module.exports = sendEmail;
