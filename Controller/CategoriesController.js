const CategoriesModel = require("../Model/CategoriesModel");

const getAllCategories = async (req, res) => {
  try {
    const categories = await CategoriesModel.getAllCategories();
    res.status(200).json({ categories: categories });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  getAllCategories,
};
