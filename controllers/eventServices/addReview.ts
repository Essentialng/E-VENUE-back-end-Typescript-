import express, { Request, Response } from "express";
import { ResultSetHeader } from "mysql2";
import pool from "../../db/db";
import getUserIDAndToken from "../users/getUserIdFromToken";

export const addReview: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { event_service_id } = req.query;

  const { rating, review }: { rating: number; review: string } = req.body;
  console.log({ rating, review, event_service_id });

  const { user_id } = getUserIDAndToken(req);
  console.log({ user_id });

  if (!event_service_id || !user_id || !rating || !review) {
    res.status(400).json({ error: "Missing required field" });
    return;
  }

  pool.getConnection((err, connection) => {
    if (err) {
      // Handle connection error
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
      return;
    } else {
      connection.query("START TRANSACTION;", (err) => {
        if (err) {
          res.status(500).json({ message: "Internal server error" });
        } else {
          try {
            connection.query<ResultSetHeader[]>(
              `
              INSERT INTO event_services_ratings
(rating,
fk_user_id,
fk_event_service_id)
VALUES
(?,
?,
?);
              `,
              [rating, user_id, event_service_id],
              (err) => {
                if (err) {
                  // Handle event insert error
                  console.error(err);
                  res.status(500).json({ error: "Internal server error" });
                  return;
                }
                connection.query<ResultSetHeader[]>(
                  `
                  INSERT INTO e_service_reviews
                  (review,
                  fk_user_id,
                  fk_event_services_id)
                  VALUES(
                  ?,
                  ?,
                  ?);            
                  `,
                  [review, user_id, event_service_id],
                  (err) => {
                    if (err) {
                      console.error(err);

                      res.status(500).json({ error: "Internal server error" });
                      return;
                    }
                    connection.query("COMMIT;", (error) => {
                      if (error) {
                        try {
                          connection.query("ROLLBACK;");
                        } catch (rollbackError) {
                          // Handle rollback error
                          console.error(rollbackError);
                        }
                        res
                          .status(500)
                          .json({ error: "Internal server error" });
                      } else {
                        res.status(200).json({
                          message: "Rating & review added successfully",
                        });
                      }
                    });
                  }
                );
              }
            );
          } catch (error) {
            connection.query("ROLLBACK;", (rollbackError) => {
              // Handle rollback error
              console.error(rollbackError);
            });
            res.status(500).json({ error: "Internal server error" });
          } finally {
            connection.release(); // Return connection to pool
          }
        }
      });
    }
  });
};
