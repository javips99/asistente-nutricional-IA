import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS (importante si el frontend está en otro origen)
app.use(cors());

// Servir frontend estático
app.use("/", express.static("public"));

// Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Instancia OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para generar la dieta con OpenAI
const generateDied = async (userResponse) => {
  const promptSystem = {
    role: "system",
    content: `Eres un nutricionista profesional y un asistente que ayuda a generar una dieta semanal.

El usuario solo puede hacer preguntas relacionadas con la dieta, con su peso, altura,
alergias, alimentos que no le gustan y número de comidas diarias.

El sistema no responderá a ningún otro tipo de solicitud que no esté relacionada con la dieta.`,
  };

  const promptUser = {
    role: "user",
    content: `
Crear una dieta semanal para una persona que pesa ${userResponse.peso} kg,
mide ${userResponse.altura} cm, y cuyo objetivo es ${userResponse.objetivo}.
La persona tiene las siguientes alergias: ${userResponse.alergias}.
Evitar los siguientes alimentos: ${userResponse.no_gusta}.
La persona quiere hacer ${userResponse.comidas_diarias} comidas diarias.
Devuelve la dieta en formato tabla markdown con las siguientes columnas:
Día, Comida, Alimentos, Nombre del plato o receta, Calorías.
Y no digas nada más, solo devuelve la tabla.
    `,
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [promptSystem, promptUser],
      max_tokens: 1000,
      temperature: 0.75,
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.error("Error al generar la dieta:", error);
    return "Lo siento, hubo un error al generar la dieta. Intenta nuevamente más tarde.";
  }
};

// Almacenamiento temporal por usuario
const userData = {};

// Ruta para manejar chat de nutrición
app.post("/api/nutri-chat", async (req, res) => {
  try {
    const userId = req.body.id;
    const userMessage = req.body.message;

    if (!userId) return res.status(400).json({ error: "Falta el ID de usuario" });
    if (!userMessage) return res.status(400).json({ error: "Falta el mensaje del usuario" });

    if (!userData[userId]) {
      userData[userId] = {};
    }

    const data = userData[userId];

    if (!data.peso) {
      data.peso = userMessage;
      return res.json({ reply: "¿Cuánto mides (cm)?" });
    }

    if (!data.altura) {
      data.altura = userMessage;
      return res.json({ reply: "¿Cuál es tu objetivo? (adelgazar, mantenerte o subir peso)" });
    }

    if (!data.objetivo) {
      data.objetivo = userMessage;
      return res.json({ reply: "¿Tienes alguna alergia?" });
    }

    if (!data.alergias) {
      data.alergias = userMessage;
      return res.json({ reply: "¿Qué alimentos no te gustan?" });
    }

    if (!data.no_gusta) {
      data.no_gusta = userMessage;
      return res.json({ reply: "¿Cuántas comidas quieres hacer al día?" });
    }

    if (!data.comidas_diarias) {
      data.comidas_diarias = userMessage;

      const dieta = await generateDied(data);

      userData[userId] = {}; // Limpiar datos para la próxima sesión

      return res.json({ reply: dieta });
    }

    return res.json({ reply: "¡Gracias por tus respuestas!" });

  } catch (error) {
    console.error("Error en la ruta /api/nutri-chat:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
