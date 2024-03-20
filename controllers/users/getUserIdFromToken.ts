import { Request } from "express";
import jwt from "jsonwebtoken";

interface TokenData {
  user_id: string;
}

export default function getUserIDAndToken(req: Request): {
  user_id: string;
  token: string;
} {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return { user_id: "", token: "" };
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenData;
    return { user_id: decodedToken.user_id, token };
  } catch (error) {
    console.error("Error decoding token:", error);
    return { user_id: "", token: "" };
  }
}
