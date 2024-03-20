import express, { Request, Response } from "express";
import pool from "../../db/db";
import { ResultSetHeader } from "mysql2";
import nodemailerFn from "../../nodemailer/nodemailer";

// need to check that the number generated has not been previously generated/ generated & invalidated.
export const forgotPassword1stStep: express.RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email }: { email: string } = req.body;

  // generate 4 random numbers that will be sent to the email address of the assumed user
  const randomNumbers = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10)
  );

  // Send the random numbers to the user's email address
  const message = `<div>${randomNumbers}</div>`; // move to the messages folder and add inline css
  const subject = "Password Reset";
  const text = `${randomNumbers}`;
  nodemailerFn(message, email, subject, text);

  // save the random numbers in the database
  const saveRandomNumbers = (
    randomNumbers: number[]
  ): Promise<ResultSetHeader> => {
    return new Promise((resolve, reject) => {
      const query =
        "INSERT INTO forgot_password_codes (number1, number2, number3, number4, number5, number6, number7, number8) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      const values = randomNumbers;

      pool.execute<ResultSetHeader>(query, values, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };

  // Call the saveRandomNumbers function to save the random numbers in the database
  try {
    await saveRandomNumbers(randomNumbers);
    console.log("Random numbers saved in the database.");
    res.status(200).json({ message: "Random numbers saved in the database." });
  } catch (error) {
    console.error("Error saving random numbers:", error);
    res.status(500).json({ error: "Failed to save random numbers." });
  }
};
