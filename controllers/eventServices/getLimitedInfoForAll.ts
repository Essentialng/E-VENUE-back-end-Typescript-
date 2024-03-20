import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getLimitedInfoForAll: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { category } = req.query;

  if (!category) {
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
          WHERE es.category = 'Photography/Videography' OR es.category = 'make_up_artise' OR es.category = 'designers'
          GROUP BY es.id
          ORDER BY es.id DESC;
               `,
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No event services found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  } else {
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
          WHERE es.category = ?
          GROUP BY es.id
          ORDER BY es.id DESC;
               `,
        [category],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
            return;
          } else if (result.length === 0) {
            res.status(404).json({ error: "No event services found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }
};
