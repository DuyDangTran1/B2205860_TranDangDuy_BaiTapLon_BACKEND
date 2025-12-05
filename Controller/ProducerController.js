const ProducerModel = require("../Model/ProducerModel");

const getAllProducer = async (req, res) => {
  try {
    const producer = await ProducerModel.getAllProducer();
    return res.status(200).json({ producer: producer });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAllProducer,
};
