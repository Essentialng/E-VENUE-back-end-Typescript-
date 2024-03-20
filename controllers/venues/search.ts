import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
// import { validateInputLength } from "../../middleware/inputs/checkLength";

// TODO: Search not working. Faulty
export const search: express.RequestHandler = (req: Request, res: Response) => {
  const {
    category,
    location,
    no_of_guest,
    venue_type,
    space_preference,
    rating,
  } = req.query;

  const new_no_of_guest = no_of_guest ?? 0;
  const new_space_preference = space_preference ?? 0;
  const new_rating = rating ?? 0;
  console.log({ new_no_of_guest });

  if (
    !category &&
    !location &&
    !no_of_guest &&
    !venue_type &&
    !space_preference &&
    !rating
  ) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  console.log({
    category,
    location,
    no_of_guest,
    venue_type,
    space_preference,
    rating,
  });

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT
      v.id, v.title, v.location, v.no_of_guest, SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img, 
      COALESCE(ROUND(AVG(vr.rating), 1), 0) AS rating
  FROM venues v
  JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
  LEFT JOIN venues_ratings vr ON v.id = vr.fk_venue_id
  WHERE category LIKE ? AND location LIKE ? AND no_of_guest >= ? AND venue_type LIKE ? AND space_preference >= ?
  GROUP BY v.id
  HAVING rating >= ?  
  ORDER BY v.id DESC; 
    `,
      [
        `%${category}%`,
        `%${location}%`,
        new_no_of_guest,
        `%${venue_type}%`,
        new_space_preference,
        new_rating,
      ],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          console.log({ result });

          res.status(404).json({ error: "No venues found" });
          return;
        } else {
          console.log({ result200: result });
          res.status(200).json({ result });
        }
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error); // Log unexpected errors
    res.status(500).json({ error: "Internal server error" });
  }
};
