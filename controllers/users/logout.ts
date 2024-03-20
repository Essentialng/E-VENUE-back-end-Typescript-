import express, { Request, Response } from "express";
import getUserIDAndToken from "./getUserIdFromToken";
import pool from "../../db/db";

export const logout: express.RequestHandler = (
  req: Request,
  res: Response
): void => {
  const { token } = getUserIDAndToken(req);

  if (!token) {
    res
      .status(200)
      .clearCookie("token", { path: "/" })
      .json({ message: "log out success" });
    return;
  }

  pool.execute(
    "INSERT INTO invalid_tokens (invalid_tokens) VALUE (?)",
    [token],
    (err, result) => {
      if (err) {
        console.error("Error invalidating token:", err);
        res.status(500).json({ error: "Internal server error" });
        return;
      }

      console.log("Token invalidated:", result);

      // Clear the cookie and redirect after successful invalidation
      res
        .status(200)
        .clearCookie("token", { path: "/" })
        .json({ message: "log out success" });
    }
  );
};
