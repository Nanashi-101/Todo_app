import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Landing page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ============================
   GET TASKS (FILTERABLE)
============================ */
app.get("/tasks", (req, res) => {
  const { status } = req.query;

  let sql = "SELECT * FROM tasks";
  let params = [];

  if (status && status !== "all") {
    sql += " WHERE status = ?";
    params.push(status);
  } else {
    sql += " WHERE status != 'deleted'";
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});

/* ============================
   ADD TASK
============================ */
app.post("/tasks", (req, res) => {
  const { title, description, due_date, due_time, priority } = req.body;

  db.run(
    `INSERT INTO tasks 
     (title, description, due_date, due_time, priority, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [title, description, due_date, due_time, priority],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ success: true, id: this.lastID });
    }
  );
});

/* ============================
   UPDATE TASK STATUS
============================ */
app.put("/tasks/:id", (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!["active", "completed", "deleted"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.run(
    `UPDATE tasks SET status = ? WHERE id = ?`,
    [status, id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

app.delete("/tasks/:id/permanent", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error("❌ Permanent delete error:", err);
      return res.status(500).json(err);
    }

    res.json({ success: true });
  });
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
