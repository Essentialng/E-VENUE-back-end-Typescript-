import express, { Request, Response } from "express";
import pool from "../../../db/db";
import { RowDataPacket } from "mysql2";
import getUserIDAndToken from "../getUserIdFromToken";

export const getProfile: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { user_id } = getUserIDAndToken(req);

  try {
    pool.execute<RowDataPacket[]>(
      `  
      SELECT user_id,
        first_name,
        last_name, 
        business_name, 
        img,
        email,
        country_code,
        phone_number,
        whatsapp_number, 
        state,
        axis,
        about_your_organisation,
        services_your_organization_provides,  
        business_state,
        business_axis,
        business_category,
        facebook,
        twitter,
        linkedin,
        instagram,
        MONTHNAME(joined_date) AS month,
        YEAR(joined_date) AS year
    FROM users
    WHERE user_id = ?;
    `,
      [user_id],
      (err, result) => {
        if (err) {
          res
            .status(500)
            .json({ error: "Internal server error. Try again later" });
          return;
        } else if (result.length === 0) {
          console.log({ result });

          res.status(404).json({ message: "Profile not found" });
          return;
        } else {
          res.status(200).json({ profile: result });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error. Try again later" });
  }
};
