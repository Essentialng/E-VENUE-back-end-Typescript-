import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const countByCategory: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT 
    SUM(category = 'meetings') AS total_meetings,
    SUM(category = 'training') AS total_training,
    SUM(category = 'cooperation') AS total_cooperation,
    SUM(category = 'party') AS total_party,
    SUM(category = 'engagement') AS total_engagement
FROM 
    events;
                `,
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Designers not found" });
          return;
        } else {
          console.log(result);

          res.status(200).json({ result });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
