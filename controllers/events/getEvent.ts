import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getEvent: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { event_id } = req.params;
  console.log(event_id ?? "no event_id");

  if (!event_id) {
    res.status(400).json({ error: "Missing event_id" });
    return;
  }

  try {
    // check if the event exists in the database. Avoid race condition

    pool.execute<RowDataPacket[]>(
      `
        SELECT
            e.event_id, e.name, e.description, e.location, e.url, e.category, e.frequency, e.time_zone, e.start_date_and_time, e.end_date_and_time, GROUP_CONCAT(eimg.imgs) AS imgs, e.price
        FROM events e 
        JOIN events_imgs eimg ON e.event_id = eimg.event_id
        WHERE e.event_id = ?
        GROUP BY e.event_id
        ORDER BY e.event_id DESC;
                `,
      [event_id],
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
