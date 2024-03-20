import express, { Request, Response } from "express";
import pool from "../../db/db";
import { jwtGenerateToken } from "../../middleware/jwt/jwt";
import { setToken } from "../../middleware/jwt/setToken";
import { RowDataPacket } from "mysql2";
import { comparePassword } from "../../middleware/bcrypt/bcryptUtils";
import { validateInputLength } from "../../middleware/inputs/checkLength";

export const login: express.RequestHandler = (req: Request, res: Response) => {
  const { email, password }: { email: string; password: string } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate the length of the inputs
  const validationFields = [
    { name: "email", maxLength: 60 },
    { name: "password", maxLength: 100 },
  ];

  const validationErrors = validateInputLength(
    { email, password },
    validationFields
  );

  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Input(s) too long", fields: validationErrors });
  }

  try {
    // Retrieve hashed password from the database based on the provided email
    pool.execute<RowDataPacket[]>(
      "SELECT email, password, user_id FROM users WHERE email = ?",
      [email],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Internal server error" });
        }

        if (result.constructor === Array && result.length === 0) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
        console.log(result);

        const storedHash: string = result[0].password;

        // Compare the entered password with the stored hash
        comparePassword(password, storedHash).then((isMatch) => {
          if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
          }

          // Passwords match, generate a JWT token and send it in the response
          const userId: number = result[0].user_id;
          const token = jwtGenerateToken(userId);

          // Set the token in a cookie
          setToken(req, res, token);

          res.status(200).json({ message: "Login successful", token });
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
