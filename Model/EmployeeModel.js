const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB");

const Collection = "NHANVIEN";

const connectCollection = async () => {
  await connectDB();
  return await getCollection(Collection);
};

const findEmployee = async (employee) => {
  const EmployeeCollection = await connectCollection();
  return await EmployeeCollection.findOne(employee);
};

const insertEmployee = async (information_employee) => {
  const EmployeeCollection = await connectCollection();
  return EmployeeCollection.insertOne(information_employee);
};

module.exports = {
  findEmployee,
  insertEmployee,
};
