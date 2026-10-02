const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TABLA = process.env.SUPABASE_TABLE || "modelos"; // <-- cambia si tu tabla se llama distinto

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(cors());
app.use(express.json());

// ---------- Documentación Swagger (OpenAPI 3) ----------
const modeloProps = {
  nombre: { type: "string", example: "Cóclea 3D" },
  descripcion: { type: "string", example: "Modelo anatómico de la cóclea" },
  categoria: { type: "string", example: "🦻 Modelos del Oído" },
  activo: { type: "boolean", example: true },
};
const idParam = {
  name: "id", in: "path", required: true, schema: { type: "integer" },
};
const bodyModelo = {
  required: true,
  content: { "application/json": { schema: { $ref: "#/components/schemas/ModeloInput" } } },
};
const ok = (desc, ref) => ({
  description: desc,
  content: { "application/json": { schema: { $ref: ref } } },
});

const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Microservicio Node.js - 3D Organ Inc",
    version: "1.0.0",
    description: "CRUD de modelos 3D sobre Supabase",
  },
  paths: {
    "/api/modelos": {
      get: {
        tags: ["Modelos"], summary: "Listar modelos",
        responses: {
          200: { description: "Lista de modelos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Modelo" } } } } },
        },
      },
      post: {
        tags: ["Modelos"], summary: "Crear modelo", requestBody: bodyModelo,
        responses: { 201: ok("Modelo creado", "#/components/schemas/Modelo"), 400: { description: "Datos inválidos" } },
      },
    },
    "/api/modelos/{id}": {
      get: {
        tags: ["Modelos"], summary: "Obtener un modelo", parameters: [idParam],
        responses: { 200: ok("Modelo encontrado", "#/components/schemas/Modelo"), 404: { description: "No existe" } },
      },
      put: {
        tags: ["Modelos"], summary: "Actualizar un modelo", parameters: [idParam], requestBody: bodyModelo,
        responses: { 200: ok("Modelo actualizado", "#/components/schemas/Modelo"), 404: { description: "No existe" } },
      },
      delete: {
        tags: ["Modelos"], summary: "Eliminar un modelo", parameters: [idParam],
        responses: { 200: { description: "Eliminado" }, 404: { description: "No existe" } },
      },
    },
  },
  components: {
    schemas: {
      ModeloInput: { type: "object", required: ["nombre", "categoria"], properties: modeloProps },
      Modelo: { type: "object", properties: { id: { type: "integer", example: 1 }, ...modeloProps } },
    },
  },
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));

// ---------- Rutas ----------
const limpiar = (b) => ({
  nombre: b.nombre,
  descripcion: b.descripcion ?? "",
  categoria: b.categoria,
  activo: b.activo ?? true,
});
const fallo = (res, error, code = 500) => res.status(code).json({ error: error.message || String(error) });

app.get("/", (_req, res) => res.json({ servicio: "microservicio-node", docs: "/docs", modelos: "/api/modelos" }));

app.get("/api/modelos", async (_req, res) => {
  const { data, error } = await supabase.from(TABLA).select("*").order("id");
  if (error) return fallo(res, error);
  res.json(data);
});

app.get("/api/modelos/:id", async (req, res) => {
  const { data, error } = await supabase.from(TABLA).select("*").eq("id", req.params.id).maybeSingle();
  if (error) return fallo(res, error);
  if (!data) return res.status(404).json({ error: "No encontrado" });
  res.json(data);
});

app.post("/api/modelos", async (req, res) => {
  if (!req.body.nombre || !req.body.categoria) return res.status(400).json({ error: "nombre y categoria son obligatorios" });
  const { data, error } = await supabase.from(TABLA).insert(limpiar(req.body)).select().single();
  if (error) return fallo(res, error);
  res.status(201).json(data);
});

app.put("/api/modelos/:id", async (req, res) => {
  const { data, error } = await supabase.from(TABLA).update(limpiar(req.body)).eq("id", req.params.id).select().maybeSingle();
  if (error) return fallo(res, error);
  if (!data) return res.status(404).json({ error: "No encontrado" });
  res.json(data);
});

app.delete("/api/modelos/:id", async (req, res) => {
  const { data, error } = await supabase.from(TABLA).delete().eq("id", req.params.id).select();
  if (error) return fallo(res, error);
  if (!data.length) return res.status(404).json({ error: "No encontrado" });
  res.json({ mensaje: "Eliminado" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Servidor escuchando en puerto ${PORT}`));
