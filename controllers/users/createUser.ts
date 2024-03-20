import express, { Request, Response } from "express";
import pool from "../../db/db";
import { jwtGenerateToken } from "../../middleware/jwt/jwt";
import { setToken } from "../../middleware/jwt/setToken";
import { ResultSetHeader } from "mysql2";
import {
  generateSalt,
  hashPassword,
} from "../../middleware/bcrypt/bcryptUtils";
import { validateInputLength } from "../../middleware/inputs/checkLength";
import nodemailerFn from "../../nodemailer/nodemailer";
import { msg } from "../../nodemailer/messages/createUser";

// add nodemailer usage
export const createUser: express.RequestHandler = async (
  req: Request,
  res: Response
) => {
  const {
    first_name,
    email,
    password,
    last_name,
  }: {
    first_name: string;
    email: string;
    password: string;
    last_name: string;
  } = req.body;

  if (!first_name || !email || !password || !last_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate the length of the inputs
  const validationFields = [
    { name: "first_name", maxLength: 20 },
    { name: "email", maxLength: 60 },
    { name: "password", maxLength: 100 },
    { name: "last_name", maxLength: 20 },
  ];

  const validationErrors = validateInputLength(
    { first_name, email, password, last_name },
    validationFields
  );

  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Input(s) too long", fields: validationErrors });
  }

  const saltRounds = 10;

  try {
    const salt = await generateSalt(saltRounds);
    const hash = await hashPassword(password, salt);

    const userExists = new Promise<boolean>((resolve) => {
      pool.execute(
        "SELECT user_id, email FROM users WHERE email = ?",
        [email],
        (err, result) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ error: err.message });
          } else {
            console.log({ userExist: result });
            resolve(result.constructor === Array && result.length > 0);
          }
        }
      );
    });

    // send error if user exists
    const exists = await userExists;
    if (exists) {
      return res.status(400).json({ error: "Email already registered." });
    }

    pool.execute<ResultSetHeader>(
      "INSERT INTO users (first_name, email, password, last_name) VALUES (?, ?, ?, ?)",
      [first_name, email, hash, last_name],
      (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Internal server error" });
        } else {
          const user_id = result.insertId;
          const token = jwtGenerateToken(user_id);

          console.log({ afterInsert: result });

          // set token in cookie
          setToken(req, res, token);

          res.status(200).json({
            message: "User created successfully",
          });
        }
      }
    );

    // send nodemailer
    nodemailerFn(msg, email, "Welcome to Evenue", msg);
  } catch (error) {
    console.log(error);
  }
};
