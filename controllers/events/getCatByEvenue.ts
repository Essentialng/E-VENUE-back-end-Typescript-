import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

// change user_id condition to admin user_id
export const adminCategoryCount: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  try {
    // check if the Venue exists in the database. Avoid race condition
    pool.execute<RowDataPacket[]>(
      `
      SELECT
      SUM(category = 'meetings') AS Meetings,
      SUM(category = 'training') AS Training,
      SUM(category = 'conference') AS Conference,
      SUM(category = 'party') AS Party,
      SUM(category = 'wedding') AS Weddings
      FROM events
      WHERE user_id = 1;
                `,
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Event not found" });
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
