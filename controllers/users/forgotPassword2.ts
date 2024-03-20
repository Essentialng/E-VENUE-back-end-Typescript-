import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import {
  hashPassword,
  generateSalt,
} from "../../middleware/bcrypt/bcryptUtils";

export const forgotPassword2ndStep: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  // get the details from body
  const { code, newPassword }: { code: string; newPassword: string } = req.body;

  // check if the code exists in the database, if the password is not older than 24 hours.
  try {
    let email: string;
    let user_id: number;
    const saltRounds = 10;

    // check if the code exists in the database, if it's not older than 24 hours
    pool.execute<RowDataPacket[]>(
      `
          SELECT request_email, code
          FROM forgot_password_codes
          WHERE code = ?
          AND REGEXP_LIKE(request_email, '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$')
          AND TIMESTAMPDIFF(DAY, timestamp, NOW()) < 1;
        `,
      [code],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(400).json({ error: "Invalid or expired code" });
          return;
        } else {
          // save the email associated with the code
          email = result[0].request_email;
          console.log(email);

          // check if the email matches the email in users table. if so, get the user_id
          pool.execute<RowDataPacket[]>(
            `
                SELECT user_id
                FROM users
                WHERE email = ?;
              `,
            [email],
            async (err, result) => {
              if (err) {
                console.error(err);
                res.status(500).json({ error: "Internal server error" });
                return;
              } else if (result.length === 0) {
                res.status(400).json({ error: "Invalid email" });
                return;
              } else {
                user_id = result[0].user_id;
                console.log(user_id);

                // update the password of the associated email
                const salt = await generateSalt(saltRounds);
                const hash = await hashPassword(newPassword, salt);

                pool.execute<ResultSetHeader>(
                  `
                      UPDATE users SET password = ? WHERE user_id = ?;
                    `,
                  [hash, user_id],
                  (err, result) => {
                    if (err) {
                      console.error(err);
                      res.status(500).json({ error: "Internal server error" });
                    } else {
                      res.status(200).json({
                        message: "Password updated successfully",
                        result,
                      });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
