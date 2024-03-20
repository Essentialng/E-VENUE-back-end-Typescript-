import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

// change user_id in query to the admin user_id
export const limitedInfoByAdmin: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const {
    category,
  }: {
    category: string;
  } = req.body; // consider replacement of req.body to req.query
  console.log({ category });

  if (!category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    pool.execute<RowDataPacket[]>(
      `
        SELECT
        e.event_id, e.name, e.location, e.start_date_and_time, SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS first_img, e.price
    FROM events e 
    JOIN events_imgs eimg ON e.event_id = eimg.event_id
    WHERE e.user_id = 1 AND e.category = ?
    GROUP BY e.event_id
    ORDER BY e.event_id DESC; 
                `,
      [category],
      (err, result) => {
        if (err) {
          console.error(err);

          res.status(500).json({ error: "Internal server error" });
        } else if (result.length === 0) {
          res.status(404).json({ error: "Events not found" });
          return;
        }
        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
  }
};
