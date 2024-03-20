import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const getAll: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const {
    categoryIdentifier,
    locationIdentifier,
    popularIdentifier,
    blacklistIdentifier,
  }: {
    categoryIdentifier: string;
    locationIdentifier: string;
    popularIdentifier: string;
    blacklistIdentifier: string;
  } = req.body;
  console.log({ categoryIdentifier });
  console.log({ popularIdentifier });
  console.log({ blacklistIdentifier });

  if (
    categoryIdentifier &&
    popularIdentifier &&
    blacklistIdentifier &&
    locationIdentifier
  ) {
    res.status(400).json({ error: "Multiple identifiers are not allowed" });
    return;
  }

  try {
    if (
      !categoryIdentifier &&
      !popularIdentifier &&
      !blacklistIdentifier &&
      !locationIdentifier
    ) {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
        SELECT
          v.id, v.title, v.location, v.no_of_guest,
          SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img,
          COALESCE(ROUND(AVG(vr.rating), 1), 0) AS rating
        FROM venues v
        JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
        LEFT JOIN venues_ratings vr ON v.id = vr.fk_venue_id
        GROUP BY v.id
        ORDER BY v.views DESC;
        `,
        (err, result) => {
          if (err) {
            console.error(err);
          }
          if (result.length === 0) {
            res.status(404).json({ error: "Venues not found" });
          }

          finalResult.push(result);

          pool.execute<RowDataPacket[]>(
            "SELECT COUNT(*) AS total FROM venues;",
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
    } else if (
      categoryIdentifier &&
      !popularIdentifier &&
      !blacklistIdentifier &&
      !locationIdentifier
    ) {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
        SELECT
          v.id, v.title, v.location, v.no_of_guest,
          SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img,
          COALESCE(ROUND(AVG(vr.rating), 1), 0) AS rating
        FROM venues v 
        JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
        LEFT JOIN venues_ratings vr ON v.id = vr.fk_venue_id
        WHERE v.category LIKE ?
        GROUP BY v.id
        ORDER BY v.id DESC;
          `,
        [`%${categoryIdentifier}%`],
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
            "SELECT SUM(category LIKE ?) AS total FROM venues;",
            [`%${categoryIdentifier}%`],
            (err, result) => {
              if (err) {
                console.error(err);
              }

              if (result.length === 0) {
                res.status(404).json({ error: "Venues not found" });
                return;
              }

              finalResult.push(result);

              res.status(200).json({ finalResult });
            }
          );
        }
      );
    } else if (
      !categoryIdentifier &&
      popularIdentifier === "popularIdentifier" &&
      blacklistIdentifier !== "blacklistIdentifier" &&
      !locationIdentifier
    ) {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
        SELECT
            v.id, v.title, v.location, v.no_of_guest,
            SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img,
            COALESCE(ROUND(AVG(vr.rating), 1), 0) AS rating
        FROM venues v
        JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
        LEFT JOIN venues_ratings vr ON v.id = vr.fk_venue_id
        GROUP BY v.id
        ORDER BY v.views DESC;
          `,
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
            "SELECT COUNT(*) AS total FROM venues",
            [`%${categoryIdentifier}%`],
            (err, result) => {
              if (err) {
                console.error(err);
                return;
              }

              if (result.length === 0) {
                res.status(404).json({ error: "Venues not found" });
                return;
              }

              finalResult.push(result);

              res.status(200).json({ finalResult });
            }
          );
        }
      );
    } else if (
      !categoryIdentifier &&
      popularIdentifier !== "popularIdentifier" &&
      blacklistIdentifier === "blacklistIdentifier" &&
      !locationIdentifier
    ) {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
        SELECT
          v.id, v.title, v.location, v.no_of_guest,
          SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img,
          COALESCE(ROUND(AVG(vr.rating), 1), 0) AS rating
        FROM venues v 
        JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
        LEFT JOIN venues_ratings vr ON v.id = vr.fk_venue_id
        WHERE v.blacklist = '1'
        GROUP BY v.id
        ORDER BY v.id DESC; 
          `,
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
            "SELECT COUNT(*) FROM venues WHERE blacklist = '1';",
            [`%${categoryIdentifier}%`],
            (err, result) => {
              if (err) {
                console.error(err);
                return;
              }

              if (result.length === 0) {
                res.status(404).json({ error: "Venues not found" });
                return;
              }

              finalResult.push(result);

              res.status(200).json({ finalResult });
            }
          );
        }
      );
    } else if (
      !categoryIdentifier &&
      !popularIdentifier &&
      blacklistIdentifier !== "blacklistIdentifier" &&
      locationIdentifier
    ) {
      const finalResult: RowDataPacket[][] = [];

      pool.execute<RowDataPacket[]>(
        `
          SELECT
          v.id, v.title, v.location, v.no_of_guest,
          SUBSTRING_INDEX(GROUP_CONCAT(vimg.imgs), ',', 1) AS first_img,
          COALESCE(ROUND(AVG(vr.rating), 1), 0) AS rating
        FROM venues v
        JOIN venue_imgs vimg ON v.id = vimg.fk_venue_id
        LEFT JOIN venues_ratings vr ON v.id = vr.fk_venue_id
        WHERE v.location LIKE ?
        GROUP BY v.id
        ORDER BY v.views DESC;
            `,
        [`%${locationIdentifier}%`],
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
            "SELECT SUM(location LIKE ?) AS total FROM venues;",
            [`%${categoryIdentifier}%`],
            (err, result) => {
              if (err) {
                console.error(err);
                return;
              }

              if (result.length === 0) {
                res.status(404).json({ error: "Venues not found" });
                return;
              }

              finalResult.push(result);

              res.status(200).json({ finalResult });
            }
          );
        }
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
