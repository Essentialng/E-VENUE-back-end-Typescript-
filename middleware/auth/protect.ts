import express, { Request, Response, NextFunction } from "express";
import pool from "../../db/db";
import getUserIDAndToken from "../../controllers/users/getUserIdFromToken";
import { RowDataPacket } from "mysql2";

const protect: express.RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token } = getUserIDAndToken(req);

  if (!token) {
    res.setHeader("X-Auth-Status", "Unauthorized");
    res.status(401).json({ error: "Unauthorized" });
    return;
  } else {
    // check for invalid token in the database. If token received is invalid, return 401
    pool.execute<RowDataPacket[]>(
      "SELECT invalid_tokens FROM invalid_tokens WHERE invalid_tokens = ?",
      [token],
      (err, result) => {
        if (err) {
          console.error("Error checking for invalid token:", err);
          res.status(500).json({ error: "Internal server error" });
          return;
        }

        if (result.length > 0) {
          res.setHeader("X-Auth-Status", "Invalid token");
          res.status(401).json({ error: "Invalid token" });
          return;
        }

        // Continue with the protected route logic here
        next();
      }
    );
  }
};

export default protect;
