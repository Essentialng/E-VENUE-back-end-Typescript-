import jwt from "jsonwebtoken";

export const jwtGenerateToken = (user_id: number) => {
  const token = jwt.sign({ user_id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};
