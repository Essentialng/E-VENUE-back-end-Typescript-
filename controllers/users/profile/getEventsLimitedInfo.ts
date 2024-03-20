import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";

export const getLimitedInfoProfile: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);
  console.log(user_id);

  try {
    const finalResult: RowDataPacket[][] = [];
    pool.execute<RowDataPacket[]>(
      `
      SELECT
   e.event_id, e.name, e.location, e.start_date_and_time,  
   SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS first_img, 
   e.price, e.views, COUNT(DISTINCT el.id) AS likes, COALESCE(e.share_count, 0) AS share_count
FROM events e
JOIN events_imgs eimg ON e.event_id = eimg.event_id
LEFT JOIN event_likes el ON e.event_id = el.fk_event_id
WHERE e.user_id = ?
GROUP BY e.event_id
ORDER BY e.event_id DESC;
        `,
      [user_id],
      (err, result) => {
        if (err) {
          console.error(err);
        }
        if (result.length === 0) {
          res.status(404).json({ error: "Events not found" });
          return;
        }

        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM events WHERE user_id = ?;",
          [user_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
            if (result.length === 0) {
              res.status(404).json({ error: "Events not found" });
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
