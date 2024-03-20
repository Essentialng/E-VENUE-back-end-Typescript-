import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";

export const getLimitedVenuesInfoProfile: express.RequestHandler = (
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
   v.id AS event_id, v.title AS name , v.location,  
   SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img, 
   v.starting_price AS price, COALESCE(v.views, 0) AS views, COUNT(DISTINCT vl.id) AS likes, COALESCE(v.share_count, 0) AS share_count
FROM venues v
JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
LEFT JOIN venue_likes vl ON v.id = vl.fk_venue_id
WHERE v.user_id = ?
GROUP BY v.id
ORDER BY v.id DESC;
        `,
      [user_id],
      (err, result) => {
        if (err) {
          console.error(err);
        }
        if (result.length === 0) {
          res.status(404).json({ error: "Venues not found" });
          return;
        }

        finalResult.push(result);

        pool.execute<RowDataPacket[]>(
          "SELECT COUNT(*) AS total FROM venues WHERE user_id = ?;",
          [user_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
            if (result.length === 0) {
              res.status(404).json({ error: "Venues not found" });
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
