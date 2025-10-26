const express = require("express");
const app = express();

app.get("/", (req, res) => {
  console.log("✅ Petición recibida en /");
  res.json({
    message: "GeoRemind API Gateway",
    status: "running",
  });
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
