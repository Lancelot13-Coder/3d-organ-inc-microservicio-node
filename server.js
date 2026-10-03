const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { createClient } = require("@supabase/supabase-js");

// Credenciales de Supabase (API REST, NO la cadena de conexión de Postgres):
//   SUPABASE_URL = https://xxxxxxxx.supabase.co
//   SUPABASE_KEY = clave "service_role" (Project Settings -> API)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;
const TABLA = process.env.SUPABASE_TABLE || "modelos";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(cors());
app.use(express.json());

// ---------- Documentación Swagger (OpenAPI 3) ----------
const swaggerSpec = {
  "openapi": "3.0.3",
  "info": {
    "title": "Microservicio Node.js - 3D Organ Inc",
    "version": "1.0.0",
    "description": "Microservicio CRUD de modelos 3D de 3D-Organ-Inc. Lee y escribe en la tabla 'modelos' de Supabase (PostgreSQL): listar, obtener, crear, editar y eliminar."
  },
  "servers": [
    {
      "url": "/"
    }
  ],
  "tags": [
    {
      "name": "Estado",
      "description": "Verificar que el servicio está vivo"
    },
    {
      "name": "Modelos",
      "description": "Listar, obtener, crear, editar y eliminar modelos 3D"
    }
  ],
  "paths": {
    "/": {
      "get": {
        "tags": [
          "Estado"
        ],
        "summary": "Verifica que el servicio está vivo",
        "responses": {
          "200": {
            "description": "Servicio activo",
            "content": {
              "application/json": {
                "example": {
                  "servicio": "microservicio-node",
                  "estado": "ok"
                }
              }
            }
          }
        }
      }
    },
    "/api/modelos": {
      "get": {
        "tags": [
          "Modelos"
        ],
        "summary": "Listar modelos 3D",
        "parameters": [
          {
            "name": "categoria",
            "in": "query",
            "required": false,
            "description": "Filtra por categoría exacta",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de modelos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Modelo"
                  }
                }
              }
            }
          },
          "500": {
            "description": "Error de base de datos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": [
          "Modelos"
        ],
        "summary": "Crear un modelo 3D",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ModeloEntrada"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Modelo creado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Modelo"
                }
              }
            }
          },
          "400": {
            "description": "JSON inválido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "422": {
            "description": "Faltan 'nombre' o 'categoria'",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Error de base de datos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/modelos/{id}": {
      "get": {
        "tags": [
          "Modelos"
        ],
        "summary": "Obtener un modelo 3D",
        "parameters": [
          {
            "$ref": "#/components/parameters/IdModelo"
          }
        ],
        "responses": {
          "200": {
            "description": "Modelo encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Modelo"
                }
              }
            }
          },
          "400": {
            "description": "Id no numérico",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Modelo no encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Error de base de datos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Modelos"
        ],
        "summary": "Editar un modelo 3D",
        "description": "Solo se actualizan los campos enviados (nombre, descripcion, categoria, activo). Debe enviarse al menos uno.",
        "parameters": [
          {
            "$ref": "#/components/parameters/IdModelo"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ModeloCambios"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Modelo actualizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Modelo"
                }
              }
            }
          },
          "400": {
            "description": "Id no numérico, JSON inválido o sin campos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Modelo no encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Error de base de datos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": [
          "Modelos"
        ],
        "summary": "Eliminar un modelo 3D",
        "parameters": [
          {
            "$ref": "#/components/parameters/IdModelo"
          }
        ],
        "responses": {
          "204": {
            "description": "Eliminado (sin contenido)"
          },
          "400": {
            "description": "Id no numérico",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "404": {
            "description": "Modelo no encontrado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "500": {
            "description": "Error de base de datos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "parameters": {
      "IdModelo": {
        "name": "id",
        "in": "path",
        "required": true,
        "description": "Id numérico del modelo",
        "schema": {
          "type": "integer",
          "example": 1
        }
      }
    },
    "schemas": {
      "ModeloEntrada": {
        "type": "object",
        "required": [
          "nombre",
          "categoria"
        ],
        "properties": {
          "nombre": {
            "type": "string",
            "example": "Cóclea 3D"
          },
          "descripcion": {
            "type": "string",
            "example": "Modelo anatómico de la cóclea"
          },
          "categoria": {
            "type": "string",
            "example": "🦻 Modelos del Oído"
          },
          "activo": {
            "type": "boolean",
            "default": true
          }
        }
      },
      "ModeloCambios": {
        "type": "object",
        "properties": {
          "nombre": {
            "type": "string",
            "example": "Cóclea 3D v2"
          },
          "descripcion": {
            "type": "string"
          },
          "categoria": {
            "type": "string",
            "example": "🤖 Modelos de Prueba"
          },
          "activo": {
            "type": "boolean",
            "example": false
          }
        }
      },
      "Modelo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "example": 1
          },
          "nombre": {
            "type": "string"
          },
          "descripcion": {
            "type": "string"
          },
          "categoria": {
            "type": "string"
          },
          "fecha_registro": {
            "type": "string",
            "format": "date-time"
          },
          "activo": {
            "type": "boolean"
          }
        }
      },
      "Error": {
        "type": "object",
        "properties": {
          "detail": {
            "type": "string",
            "example": "Modelo 3D no encontrado"
          }
        }
      }
    }
  }
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (_req, res) => res.json(swaggerSpec));

// ---------- Utilidades ----------
const CAMPOS = ["nombre", "descripcion", "categoria", "activo"];
const detalle = (res, code, mensaje) => res.status(code).json({ detail: mensaje });
const errorBD = (res, error) => detalle(res, 500, "Error de base de datos: " + (error.message || String(error)));
const leerId = (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    detalle(res, 400, "El id debe ser numérico");
    return null;
  }
  return id;
};

// ---------- Rutas ----------
app.get("/", (_req, res) => res.json({ servicio: "microservicio-node", estado: "ok", docs: "/docs" }));

app.get("/api/modelos", async (req, res) => {
  let consulta = supabase.from(TABLA).select("*").order("id");
  if (req.query.categoria) consulta = consulta.eq("categoria", req.query.categoria);
  const { data, error } = await consulta;
  if (error) return errorBD(res, error);
  res.json(data);
});

app.get("/api/modelos/:id", async (req, res) => {
  const id = leerId(req, res);
  if (id === null) return;
  const { data, error } = await supabase.from(TABLA).select("*").eq("id", id).maybeSingle();
  if (error) return errorBD(res, error);
  if (!data) return detalle(res, 404, "Modelo 3D no encontrado");
  res.json(data);
});

app.post("/api/modelos", async (req, res) => {
  const b = req.body || {};
  if (!b.nombre || !b.categoria) return detalle(res, 422, "Los campos 'nombre' y 'categoria' son obligatorios");
  const nuevo = {
    nombre: b.nombre,
    descripcion: b.descripcion ?? "",
    categoria: b.categoria,
    activo: b.activo ?? true,
  };
  const { data, error } = await supabase.from(TABLA).insert(nuevo).select().single();
  if (error) return errorBD(res, error);
  res.status(201).json(data);
});

app.put("/api/modelos/:id", async (req, res) => {
  const id = leerId(req, res);
  if (id === null) return;
  const cambios = {};
  for (const campo of CAMPOS) {
    if (req.body && req.body[campo] !== undefined) cambios[campo] = req.body[campo];
  }
  if (Object.keys(cambios).length === 0) return detalle(res, 400, "No se envió ningún campo para actualizar");
  const { data, error } = await supabase.from(TABLA).update(cambios).eq("id", id).select().maybeSingle();
  if (error) return errorBD(res, error);
  if (!data) return detalle(res, 404, "Modelo 3D no encontrado");
  res.json(data);
});

app.delete("/api/modelos/:id", async (req, res) => {
  const id = leerId(req, res);
  if (id === null) return;
  const { data, error } = await supabase.from(TABLA).delete().eq("id", id).select();
  if (error) return errorBD(res, error);
  if (!data || data.length === 0) return detalle(res, 404, "Modelo 3D no encontrado");
  res.status(204).end();
});

// JSON mal formado en el cuerpo de la petición
app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.parse.failed") return detalle(res, 400, "JSON inválido en el cuerpo de la petición");
  console.error(err);
  detalle(res, 500, "Error interno del servidor");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(`Servidor escuchando en puerto ${PORT}`));
