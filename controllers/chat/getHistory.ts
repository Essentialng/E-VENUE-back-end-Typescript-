import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";
// import { validateInputLength } from "../../middleware/inputs/checkLength";

export const getChatHistory: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { fk_sender_id, fk_recipient_id } = req.query;

  if (!fk_sender_id || !fk_recipient_id) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Block unauthorized access of the history
  const { user_id } = getUserIDAndToken(req);

  if (!user_id && fk_sender_id !== user_id && fk_recipient_id !== user_id) {
    res.status(401).json({ error: "Unauthorized access" });
    return;
  }

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT chat.id,
    message,
    fk_sender_id,
    fk_recipient_id
FROM chat
WHERE (fk_sender_id = ? AND fk_recipient_id = ?) OR (fk_sender_id = ? AND fk_recipient_id = ?)
    `,
      [fk_sender_id, fk_recipient_id, fk_recipient_id, fk_sender_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No history found" });
          return;
        } else {
          res.status(200).json({ result });
        }
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error); // Log unexpected errors
    res.status(500).json({ error: "Internal server error" });
  }
};
