import bcrypt from "bcryptjs";

const hashing = async (data: string) => {
  return bcrypt.hash(data, 10);
};

export default hashing;
