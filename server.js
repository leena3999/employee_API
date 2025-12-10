const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const app = express();
app.use(express.json());


let employees = [
  { id: 1, name: "Leena", salary: 45000, joiningYear: 2022 },
  { id: 2, name: "Rachana", salary: 55000, joiningYear: 2023 },
  { id: 3, name: "Amit", salary: 60000, joiningYear: 2021 }
];

// ---------------- SWAGGER SETUP -----------------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Employee API",
      version: "1.0.0",
      description: "Employee CRUD API with robust filtering"
    }
  },
  apis: ["./server.js"]
};
const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------------------------------------------

// ----------------- ROUTES -----------------

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     responses:
 *       200:
 *         description: Successful
 */
app.get("/employees", (req, res) => {
  res.json({ success: true, data: employees });
});

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee data
 *       404:
 *         description: Employee not found
 */
app.get("/employees/:id", (req, res) => {
  const id = Number(req.params.id);
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });
  res.json({ success: true, data: emp });
});

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               salary:
 *                 type: integer
 *               joiningYear:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Employee created
 */
app.post("/employees", (req, res) => {
  const { id, name, salary, joiningYear } = req.body;
  if (!id || !name) return res.status(400).json({ success: false, message: "id and name required" });
  const exists = employees.find(e => e.id === Number(id));
  if (exists) return res.status(400).json({ success: false, message: "Employee with this id already exists" });

  const newEmp = { id: Number(id), name, salary: Number(salary) || 0, joiningYear: Number(joiningYear) || null };
  employees.push(newEmp);
  res.status(201).json({ success: true, message: "Employee created", data: newEmp });
});

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               salary:
 *                 type: integer
 *               joiningYear:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 */
app.put("/employees/:id", (req, res) => {
  const id = Number(req.params.id);
  const emp = employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ success: false, message: "Employee not found" });

  if (req.body.name !== undefined) emp.name = req.body.name;
  if (req.body.salary !== undefined) emp.salary = Number(req.body.salary) || emp.salary;
  if (req.body.joiningYear !== undefined) emp.joiningYear = Number(req.body.joiningYear) || emp.joiningYear;

  return res.json({ success: true, message: "Employee updated", data: emp });
});

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deleted
 */
app.delete("/employees/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = employees.length;
  employees = employees.filter(e => e.id !== id);
  if (employees.length === before) return res.status(404).json({ success: false, message: "Employee not found" });
  return res.json({ success: true, message: `Employee ${id} deleted` });
});

/**
 * @swagger
 * /employees/filter:
 *   get:
 *     summary: Filter employees by salary and year
 *     tags: [Employees]
 *     parameters:
 *       - in: query
 *         name: salary
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filtered employees list
 */
app.get("/employees/filter", (req, res) => {
  // log for debugging in terminal
  console.log("FILTER called with raw query:", req.query);

  // Get raw values
  const rawSalary = req.query.salary;
  const rawYear = req.query.year;

  // Convert safely: Number("55000") => 55000, Number("") => 0, Number("year") => NaN
  const salary = rawSalary === undefined ? undefined : Number(rawSalary);
  const year = rawYear === undefined ? undefined : Number(rawYear);

  let result = employees;

  // Apply salary filter only if salary is a valid number and > 0
  if (salary !== undefined && !isNaN(salary) && salary > 0) {
    result = result.filter(e => e.salary >= salary);
  }

  // Apply year filter only if year is a valid number and reasonable
  if (year !== undefined && !isNaN(year) && year > 1900) {
    result = result.filter(e => e.joiningYear === year);
  }

  // Always return array (even empty)
  return res.json({ success: true, data: result });
});

// ----------------- SERVER -----------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Open Swagger at: http://localhost:5000/api-docs");
});
