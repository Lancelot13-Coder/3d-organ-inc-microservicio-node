const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const HEADERS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

function respuesta(statusCode, cuerpo) {
  return { statusCode, headers: HEADERS_CORS, body: JSON.stringify(cuerpo) };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return respuesta(200, {});
  }

  if (event.httpMethod === "GET") {
    const idSolicitado = event.queryStringParameters && event.queryStringParameters.id;
    const categoriaFiltro = event.queryStringParameters && event.queryStringParameters.categoria;
    let consulta = supabase.from("modelos").select("*");
    if (idSolicitado) consulta = consulta.eq("id", idSolicitado);
    if (categoriaFiltro) consulta = consulta.eq("categoria", categoriaFiltro);
    const { data, error } = await consulta;
    if (error) return respuesta(500, { detail: error.message });
    if (idSolicitado) {
      if (!data || data.length === 0) return respuesta(404, { detail: "Modelo 3D no encontrado" });
      return respuesta(200, data[0]);
    }
    return respuesta(200, data);
  }

  if (event.httpMethod === "POST") {
    let cuerpo;
    try {
      cuerpo = JSON.parse(event.body || "{}");
    } catch (err) {
      return respuesta(400, { detail: "JSON inválido en el cuerpo de la petición" });
    }
    if (!cuerpo.nombre || !cuerpo.categoria) {
      return respuesta(422, { detail: "Los campos 'nombre' y 'categoria' son obligatorios" });
    }
    const nuevoRegistro = {
      nombre: cuerpo.nombre,
      descripcion: cuerpo.descripcion || "",
      categoria: cuerpo.categoria,
      activo: cuerpo.activo !== undefined ? cuerpo.activo : true,
    };
    const { data, error } = await supabase.from("modelos").insert(nuevoRegistro).select().single();
    if (error) return respuesta(500, { detail: error.message });
    return respuesta(201, data);
  }

  if (event.httpMethod === "PUT") {
    const idSolicitado = event.queryStringParameters && event.queryStringParameters.id;
    if (!idSolicitado) return respuesta(400, { detail: "Falta el parámetro ?id= del modelo a editar" });
    let cambios;
    try {
      cambios = JSON.parse(event.body || "{}");
    } catch (err) {
      return respuesta(400, { detail: "JSON inválido en el cuerpo de la petición" });
    }
    const { data, error } = await supabase.from("modelos").update(cambios).eq("id", idSolicitado).select().single();
    if (error) return respuesta(500, { detail: error.message });
    if (!data) return respuesta(404, { detail: "Modelo 3D no encontrado" });
    return respuesta(200, data);
  }

  if (event.httpMethod === "DELETE") {
    const idSolicitado = event.queryStringParameters && event.queryStringParameters.id;
    if (!idSolicitado) return respuesta(400, { detail: "Falta el parámetro ?id= del modelo a eliminar" });
    const { error } = await supabase.from("modelos").delete().eq("id", idSolicitado);
    if (error) return respuesta(500, { detail: error.message });
    return { statusCode: 204, headers: HEADERS_CORS, body: "" };
  }

  return respuesta(405, { detail: "Método no permitido" });
};