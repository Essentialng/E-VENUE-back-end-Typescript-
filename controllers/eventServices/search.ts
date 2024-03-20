import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
// import { validateInputLength } from "../../middleware/inputs/checkLength";

export const search: express.RequestHandler = (req: Request, res: Response) => {
  const { location, category } = req.query;

  if (!location && !category) {
    res.status(400).json({ error: "Missing required fields" });
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
          es.id, es.name, es.location, es.verified, es.category,
          SUBSTRING_INDEX(GROUP_CONCAT(esimg.imgs), ',', 1) AS first_img,
          COALESCE(ROUND(AVG(esr.rating), 1), 0) AS rating, COUNT(DISTINCT esr.fk_user_id) AS total_raings_no
        FROM event_services es
        LEFT JOIN event_services_imgs esimg ON es.id = esimg.fk_event_services_id
        LEFT JOIN event_services_ratings esr ON es.id = esr.fk_event_service_id
        WHERE es.category LIKE ? AND es.location LIKE ? 
        GROUP BY es.id
        ORDER BY es.id DESC;
    `,
      [`%${category}%`, `%${location}%`],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "No event services found" });
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
