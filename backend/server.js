const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./db");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "bloodconnect_secret_key";

function generateToken(username) {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64").replace(/=/g, "");
    const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64").replace(/=/g, "");
    const signature = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    if (signature !== expectedSig) return null;
    try {
        const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
        if (decoded.exp < Date.now()) return null; // expired
        return decoded;
    } catch (e) {
        return null;
    }
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Unauthorized access: Token missing" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: "Unauthorized access: Token invalid or expired" });
    }
    req.admin = decoded;
    next();
}

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("BloodConnect Backend Running 🚀");
});
app.post("/register-donor", (req, res) => {
    const { name, bloodGroup, city, phone, email, active } = req.body;

    const sql = `
        INSERT INTO donors (name, blood_group, city, phone, email, active)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, bloodGroup, city, phone, email, active], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Donor registration failed"
            });
        }

        res.json({
            success: true,
            message: "Donor registered successfully",
            donorId: result.insertId
        });
    });
});
app.get("/donors", (req, res) => {
    const sql = "SELECT * FROM donors ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch donors"
            });
        }

        res.json(results);
    });
});
app.post("/requests", (req, res) => {
    const { patientName, bloodGroup, hospital, city, phone, urgency } = req.body;

    const sql = `
        INSERT INTO requests (patient_name, blood_group, hospital, city, phone, urgency)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [patientName, bloodGroup, hospital, city, phone, urgency], (err, result) => {
        if (err) return res.status(500).json({ success: false });

        res.json({ success: true, requestId: result.insertId });
    });
});

app.get("/requests", (req, res) => {
    const sql = "SELECT * FROM requests ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false });

        res.json(results);
    });
});
app.put("/requests/:id/fulfill", (req, res) => {
    const { id } = req.params;

    const sql = "UPDATE requests SET status = 'fulfilled' WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false });
        }

        res.json({ success: true, message: "Request fulfilled" });
    });
});
app.get("/pending-requests", (req, res) => {
    const sql = "SELECT * FROM requests WHERE status = 'pending' ORDER BY id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ success: false });
        }

        res.json(results);
    });
});

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    const expectedUser = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "adminconnect2026";

    if (username === expectedUser && password === expectedPassword) {
        const token = generateToken(username);
        return res.json({ success: true, token });
    }

    res.status(401).json({ success: false, message: "Invalid username or password" });
});

app.put("/donors/:id/status", authMiddleware, (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE donors SET active = NOT active WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ success: false, message: "Failed to toggle status" });
        }
        res.json({ success: true, message: "Status toggled successfully" });
    });
});

app.delete("/donors/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM donors WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ success: false, message: "Failed to delete donor" });
        }
        res.json({ success: true, message: "Donor deleted successfully" });
    });
});
app.put("/donors/:id/toggle", (req, res) => {
    const { id } = req.params;

    const sql = "UPDATE donors SET active = NOT active WHERE id = ?";

    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ success: false });

        res.json({ success: true, message: "Donor status updated" });
    });
});

app.delete("/donors/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM donors WHERE id = ?";

    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ success: false });

        res.json({ success: true, message: "Donor deleted" });
    });
});
app.listen(5000, () => {
    console.log("Server running on port 5000");
});