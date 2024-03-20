import express, { Request, Response } from "express";
import pool from "../../db/db";
import { RowDataPacket } from "mysql2";

export const searchGroup: express.RequestHandler = (
  req: Request,
  res: Response
) => {
  const { group_name } = req.query;

  console.log({ group_name });

  if (!group_name) {
    res.status(400).json({ error: "Missing required fields" });
  }

  try {
    pool.execute<RowDataPacket[]>(
      `
      SELECT eg.id,
      eg.name,
      eg.about,
      eg.logo,
      eg.fk_user_id
      , COUNT(egm.fk_user_id) as member_total
  FROM egroups eg
  LEFT JOIN egroup_members egm ON egm.fk_egroup_id = eg.id
  WHERE eg.name LIKE ?
  GROUP BY eg.id;
    `,
      [`%${group_name}%`],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: "Internal server error" });
          return;
        } else if (result.length === 0) {
          res.status(404).json({ error: "Groups not found" });
          return;
        }
        res.status(200).json({ result });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
