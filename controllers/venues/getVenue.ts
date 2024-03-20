import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getVenue: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { venue_id } = req.params;
  console.log(venue_id ?? "no venue_id");

  if (!venue_id) {
    res.status(400).json({ error: "Missing venue_id" });
    return;
  }

  try {
    // check if the Venue exists in the database. Avoid race condition

    pool.execute<RowDataPacket[]>(
      `
      SELECT
            v.id, v.title, v.description, v.category, v.select_type, v.bathrooms, v.toilets, v.starting_price, v.location, v.no_of_guest, 
            v.space_preference, GROUP_CONCAT(vimg.imgs) AS imgs, v.vEmail, v.vPhone, v.venue_type,
            v.no_of_guest AS seating, opening_hours.opening_hours
        FROM venues v
        JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
        LEFT JOIN (
    SELECT fk_venue_id,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'hours_id', id,
                'MONDAY_OPEN', MONDAY_OPEN, 
                'MONDAY_CLOSE', MONDAY_CLOSE,
                'TUESDAY_OPEN', TUESDAY_OPEN, 
                'TUESDAY_CLOSE', TUESDAY_CLOSE,
                'WEDNESDAY_OPEN', WEDNESDAY_OPEN, 
                'WEDNESDAY_CLOSE', WEDNESDAY_CLOSE, 
                'THURSDAY_OPEN', THURSDAY_OPEN ,
                'THURSDAY_CLOSE', THURSDAY_CLOSE ,
                'FRIDAY_OPEN', FRIDAY_OPEN ,
                'FRIDAY_CLOSE', FRIDAY_CLOSE ,
                'SATURDAY_OPEN', SATURDAY_OPEN ,
                'SATURDAY_CLOSE', SATURDAY_CLOSE ,
                'SUNDAY_OPEN', SUNDAY_OPEN ,
                'SUNDAY_CLOSE', SUNDAY_CLOSE
            )
        ) AS opening_hours
    FROM venue_hours
    GROUP BY fk_venue_id
) AS opening_hours ON v.id = opening_hours.fk_venue_id
        WHERE v.id = ?
        GROUP BY v.id 
        ORDER BY v.id DESC;
                `,
      [venue_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Venue not found" });
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
