var express = require("express");
var router = express.Router();
const Link = require("../models/link");

function generateCode() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUWXYZabcdefghijklmnopqrstuwxyz0123456789";
  for (let i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function calculateTime(startTime, endTime) {
  const time = endTime - startTime;
  const timeInSeconds = time / 1000;
  const timeInMinutes = timeInSeconds / 60;
  const timeInHours = timeInMinutes / 60;
  const timeInDays = timeInHours / 24;

  return {
    timeInMileseconds: time,
    timeInSeconds,
    timeInMinutes,
    timeInHours,
    timeInDays,
  };
}
router.get("/:code/stats", async (req, res, next) => {
  const code = req.params.code;

  const result = await Link.findOne({ where: { code } });
  if (!result) return res.sendStatus(404);

  res.render("statsAccess", result.dataValues);
});

router.get("/:code", async (req, res, next) => {
  const code = req.params.code;

  const result = await Link.findOne({ where: { code } });
  if (!result) return res.sendStatus(404);

  result.hits++;
  await result.save();
  res.redirect(result.url);
});

router.get("/", function (req, res, next) {
  res.render("index", { title: "Encurtador de URL" });
});

router.put("/new", async (req, res, next) => {
  const url = req.body.url;
  const alias = req.body.alias;
  const code = generateCode();
  const startTime = performance.now();
  if (typeof alias != "undefined" && alias != "") {
    const aliasAlreadyExists = await Link.findOne({ where: { alias } });
    if (aliasAlreadyExists)
      return res.status(409).json({
        alias: alias,
        error: "ERR_CODE: 001, Description:CUSTOM ALIAS ALREADY EXISTS",
      });
  }

  const result = await Link.create({
    alias,
    code,
    url,
  });

  const endTime = performance.now();
  const { timeInMileseconds } = calculateTime(startTime, endTime);

  return res.status(200).json({
    alias: result.alias,
    url: result.url,
    statistics: {
      time_taken: `${timeInMileseconds.toFixed(0)}ms`,
    },
  });
});

router.post("/new", async (req, res, next) => {
  const url = req.body.url;
  const alias = req.body.alias;
  const code = generateCode();

  if (typeof alias != "undefined" && alias != "") {
    const aliasAlreadyExists = await Link.findOne({ where: { alias } });
    if (aliasAlreadyExists)
      return res.status(409).json({
        error: "ERR_CODE: 001, Description:CUSTOM ALIAS ALREADY EXISTS",
      });
  }

  const result = await Link.create({
    alias,
    code,
    url,
  });

  res.render("statsAccess", result.dataValues);
});

router.get("/url/:alias", async (req, res, next) => {
  const alias = req.params.alias;
console.log('1', alias)
  if (typeof alias != "undefined" && alias != "") {
    const result = await Link.findOne({ where: { alias } });
    if (!result)
      return res.status(404).json({
        alias: alias,
        error: "ERR_CODE: 002, Description:SHORTENED alias NOT FOUND",
      });
      console.log(alias)
    return res.redirect(result.url)
  }
});

module.exports = router;
