import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const getServiceProvider: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { sProvider_id } = req.params;
  console.log(sProvider_id ?? "no sProvider_id");

  if (!sProvider_id) {
    res.status(400).json({ error: "Missing sProvider_id" });
    return;
  }

  let { user_id } = getUserIDAndToken(req);

  if (!user_id) {
    user_id = "0";
  }

  try {
    // check if the event exists in the database. Avoid race condition

    pool.execute<RowDataPacket[]>(
      `
      SELECT
    es.id,
    es.name,
    es.location,
    es.verified,
    es.bio,
    es.profession,
    es.category,
    es.email,
    es.phone_number,
    es.experience_duration,
    GROUP_CONCAT(esimg.imgs) AS imgs,
    COALESCE(ROUND(AVG(esr.rating), 1), 0) AS rating,
    COUNT(DISTINCT esr.fk_user_id) AS total_raings_no,
    opening_hours.opening_hours,
    CASE WHEN EXISTS(
    SELECT 1 FROM e_service_reviews esrev WHERE esrev.fk_user_id = ?
    AND fk_event_services_id = es.id
    ) THEN 1 ELSE 0 END AS user_has_reviewed
FROM event_services es
LEFT JOIN event_services_imgs esimg ON es.id = esimg.fk_event_services_id
LEFT JOIN event_services_ratings esr ON es.id = esr.fk_event_service_id
LEFT JOIN (
    SELECT fk_event_service_id,
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'hours_id', id,
                'MONDAY_OPEN', MONDAY_OPEN,
                'MONDAY_CLOSE', MONDAY_CLOSE,
                'TUESDAY_OPEN', TUESDAY_OPEN,
                'TUESDAY_CLOSE', TUESDAY_CLOSE,
                'WEDNESDAY_OPEN', WEDNESDAY_OPEN,
                'WEDNESDAY_CLOSE', WEDNESDAY_CLOSE,
                'THURSDAY_OPEN', THURSDAY_OPEN,
                'THURSDAY_CLOSE', THURSDAY_CLOSE,
                'FRIDAY_OPEN', FRIDAY_OPEN,
                'FRIDAY_CLOSE', FRIDAY_CLOSE,
                'SATURDAY_OPEN', SATURDAY_OPEN,
                'SATURDAY_CLOSE', SATURDAY_CLOSE,
                'SUNDAY_OPEN', SUNDAY_OPEN,
                'SUNDAY_CLOSE', SUNDAY_CLOSE
            )
        ) AS opening_hours
    FROM event_service_hours
    GROUP BY fk_event_service_id
) AS opening_hours ON es.id = opening_hours.fk_event_service_id
WHERE es.id = ?
GROUP BY es.id
ORDER BY es.id DESC;   
                `,
      [user_id, sProvider_id],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Service not found" });
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
