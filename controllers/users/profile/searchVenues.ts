import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";
// import { validateInputLength } from "../../middleware/inputs/checkLength";

export const searchVenues: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { title, location, category, venue_type, starting_price } = req.query;
  console.log({
    title,
    location,
    category,
    frequency: venue_type,
    starting_price,
  });

  if (!title && !location && !category && !venue_type && !starting_price) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const { user_id } = getUserIDAndToken(req);
  if (!user_id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  /* TODO */
  // Validate the length of the inputs
  // const defaultx = "0";
  //     const validationFields = [
  //       { name: "name", maxLength: 100 },
  //       { name: "newPassword", maxLength: 100 },
  //     ];

  //     const validationErrors = validateInputLength(
  //       { name: name || defaultx, location: location || defaultx, category: category || defaultx },
  //       validationFields
  //     );

  //     if (validationErrors.length > 0) {
  //       res
  //         .status(400)
  //         .json({ error: "Input(s) too long", fields: validationErrors });
  //       return;
  //     }

  try {
    pool.execute<RowDataPacket[]>(
      ` 
      SELECT
   v.id AS event_id, v.title AS name , v.location, v.no_of_guest, 
   SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img, 
   v.starting_price AS price, v.views, COUNT(DISTINCT vl.id) AS likes, COALESCE(v.share_count, 0) AS share_count
FROM venues v 
JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
LEFT JOIN venue_likes vl ON v.id = vl.fk_venue_id
WHERE v.title LIKE ? AND v.location LIKE ? AND v.category LIKE ? AND v.venue_type LIKE ? AND v.starting_price >= ? AND v.user_id = ?
GROUP BY v.id
ORDER BY v.id DESC;
    `,
      [
        `%${title}%`,
        `%${location}%`,
        `%${category}%`,
        `%${venue_type}%`,
        starting_price,
        user_id,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No events found" });
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
