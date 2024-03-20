import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";
// import { validateInputLength } from "../../middleware/inputs/checkLength";

export const searchEvent: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { name, location, category, frequency, price } = req.query;
  console.log({ name, location, category, frequency, price });

  if (!name && !location && !category && !frequency && !price) {
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
   e.event_id, e.name, e.location, e.start_date_and_time, 
   SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS first_img, 
   e.price, e.views, COUNT(DISTINCT el.id) AS likes, COALESCE(e.share_count, 0) AS share_count
FROM events e
JOIN events_imgs eimg ON e.event_id = eimg.event_id
LEFT JOIN event_likes el ON e.event_id = el.fk_event_id
WHERE e.name LIKE ? AND e.location LIKE ? AND e.category LIKE ? AND e.frequency LIKE ? AND e.price >= ? AND e.user_id = ?
GROUP BY e.event_id
ORDER BY e.event_id DESC;
    `,
      [
        `%${name}%`,
        `%${location}%`,
        `%${category}%`,
        `%${frequency}%`,
        price,
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
