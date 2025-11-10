import bcrypt from "bcryptjs";

const hashing = async (data: string) => {
  return bcrypt.hash(data, 12);
};

export default hashing;
