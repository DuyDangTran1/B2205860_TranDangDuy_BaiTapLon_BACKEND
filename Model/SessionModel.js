const {
  connectDB,
  getCollection,
} = require("../ConnectMongoDB/ConnectMongoDB");

const createRefreshToken = async (session) => {
  await connectDB();
  const sessionCollection = await getCollection("Session");
  await sessionCollection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  );

  return await sessionCollection.insertOne(session);
};

const isExistSession = async (email) => {
  await connectDB();
  const sessionCollection = await getCollection("Session");
  if (!(await sessionCollection.findOne({ email: email }))) return false;

  return true;
};

const findSessionByEmail = async (email) => {
  await connectDB();
  const sessionCollection = await getCollection("Session");
  return await sessionCollection.findOne({ email: email });
};

const findSessionByRefresh = async (refresh) => {
  await connectDB();
  const sessionCollection = await getCollection("Session");
  return await sessionCollection.findOne({ refresh_token: refresh });
};

const removeSessionByEmail = async (user) => {
  await connectDB();
  const sessionCollection = await getCollection("Session");
  return await sessionCollection.deleteOne({ email: user.EMAIL });
};

const removeSessionByEmailEmployee = async (Email) => {
  await connectDB();
  const sessionCollection = await getCollection("Session");
  return await sessionCollection.deleteOne({ email: Email });
};

module.exports = {
  createRefreshToken,
  isExistSession,
  findSessionByEmail,
  findSessionByRefresh,
  removeSessionByEmail,
  removeSessionByEmailEmployee,
};
