import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

// consider multiple queries for each case that pushes to an array. Pushes total number of events and other details. Maybe object or array like.
export const getLimitedInfo: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const {
    categoryIdentifier,
    locationIdentifier,
    topEventsIdentifier,
    blacklistIdentifier,
  }: {
    categoryIdentifier: string;
    locationIdentifier: string;
    topEventsIdentifier: string;
    blacklistIdentifier: string;
  } = req.body; // consider replacement of req.body to req.query
  console.log({ locationIdentifier });
  console.log({ topEventsIdentifier });
  console.log({ blacklistIdentifier });

  if (
    locationIdentifier &&
    topEventsIdentifier &&
    blacklistIdentifier &&
    categoryIdentifier
  ) {
    res.status(400).json({ error: "Multiple identifiers are not allowed" });
    return;
  } else if (
    topEventsIdentifier &&
    topEventsIdentifier !== "topEventsIdentifier"
  ) {
    res.status(400).json({ error: "Invalid top events identifier" });
    return;
  } else if (
    blacklistIdentifier &&
    blacklistIdentifier !== "blacklistIdentifier"
  ) {
    res.status(400).json({ error: "Invalid blacklist identifier" });
    return;
  }

  try {
    if (
      !locationIdentifier &&
      !topEventsIdentifier &&
      !blacklistIdentifier &&
      !categoryIdentifier
    ) {
      pool.execute<RowDataPacket[]>(
        `
                SELECT
                    e.event_id, e.name, e.location, e.start_date_and_time, SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS first_img, e.price
                FROM events e 
                JOIN events_imgs eimg ON e.event_id = eimg.event_id
                GROUP BY e.event_id
                ORDER BY e.event_id DESC;  
                `,
        (err, result) => {
          if (err) {
            console.error(err);

            res.status(500).json({ error: "Internal server error" });
          } else if (result.length === 0) {
            res.status(404).json({ error: "Events not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } else if (locationIdentifier) {
      pool.execute<RowDataPacket[]>(
        `
        SELECT
        e.event_id, e.name, e.location, e.start_date_and_time, SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS z_img, e.views, e.price
    FROM events e 
    JOIN events_imgs eimg ON e.event_id = eimg.event_id
    GROUP BY e.event_id
    ORDER BY e.views DESC;
            `,
        [locationIdentifier],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
          } else if (result.length === 0) {
            res.status(404).json({ error: "Events not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } else if (topEventsIdentifier === "topEventsIdentifier") {
      // views can be incremented only
      pool.execute<RowDataPacket[]>(
        `
        SELECT
                e.event_id, e.name, e.location, e.start_date_and_time, SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS first_img, e.views, e.price
            FROM events e 
            JOIN events_imgs eimg ON e.event_id = eimg.event_id
            GROUP BY e.event_id
            ORDER BY e.views DESC;
        `,
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
          } else if (result.length === 0) {
            res.status(404).json({ error: "Events not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } else if (blacklistIdentifier === "blacklistIdentifier") {
      pool.execute<RowDataPacket[]>(
        `
        SELECT
                e.event_id, e.name, e.location, e.start_date_and_time, SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) AS first_img, e.views, e.price
            FROM events e 
            JOIN events_imgs eimg ON e.event_id = eimg.event_id
            WHERE e.blacklist = '1'
            GROUP BY e.event_id
            ORDER BY e.views DESC;
        `,
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
          } else if (result.length === 0) {
            res.status(404).json({ error: "Events not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    } else if (categoryIdentifier) {
      pool.execute<RowDataPacket[]>(
        `
        SELECT
                e.event_id, e.name, e.location, e.start_date_and_time, SUBSTRING_INDEX(GROUP_CONCAT(eimg.imgs), ',', 1) 
                AS first_img, e.views, e.price
            FROM events e 
            JOIN events_imgs eimg ON e.event_id = eimg.event_id
            WHERE e.category = ?
            GROUP BY e.event_id
            ORDER BY e.views DESC;
        `,
        [categoryIdentifier],
        (err, result) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
          } else if (result.length === 0) {
            res.status(404).json({ error: "Events not found" });
            return;
          }
          res.status(200).json({ result });
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};
