import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getInbox: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const finalResult: RowDataPacket[][] = [];
    pool.execute<RowDataPacket[]>(
      `
      SELECT 
      c.id,
      c.message,
      c.fk_sender_id,
      c.fk_recipient_id
  FROM 
      chat c
  INNER JOIN (
      SELECT 
          MAX(id) AS min_id
      FROM 
          chat
      GROUP BY 
          fk_sender_id,
          fk_recipient_id
  ) AS sub ON c.id = sub.min_id
  WHERE fk_sender_id = ? OR fk_recipient_id = ?;
  
        `,
      [user_id, user_id],
      (err, result) => {
        if (err) {
          console.error(err);
        }
        if (result.length === 0) {
          res.status(404).json({ error: "Messages showcase not found" });
        }

        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          `
            SELECT COUNT(*) AS result_count
            FROM (
                SELECT 
                    c.id,
                    c.message,
                    c.fk_sender_id,
                    c.fk_recipient_id
                FROM 
                    chat c
                INNER JOIN (
                    SELECT 
                        MAX(id) AS min_id
                    FROM 
                        chat
                    GROUP BY 
                        fk_sender_id,
                        fk_recipient_id
                ) AS sub ON c.id = sub.min_id
                WHERE 
                    fk_sender_id = ? OR fk_recipient_id = ?
            ) AS subquery;
            
            `,
          [user_id, user_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
            if (result.length === 0) {
              res.status(404).json({ error: "Messages not found" });
            }

            finalResult.push(result);

            res.status(200).json({ finalResult });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
