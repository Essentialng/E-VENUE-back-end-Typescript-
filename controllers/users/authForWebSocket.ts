import express, { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../../db/db";

export const authenticateUser: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { userId } = req.query;

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT first_name FROM users WHERE user_id = ?
            `,
      [userId],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No posts yet." });
          return;
        }
        console.log({ result });

        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
