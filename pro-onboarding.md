  ---
  📋 RESUMEN EJECUTIVO - LÓGICA CONVERSACIONAL CHAT24x7

  ARQUITECTURA GENERAL

  Stack Tecnológico:
  - Backend: Node.js + Express + MongoDB + OpenAI API
  - Frontend: Vanilla JavaScript + HTML/CSS
  - Autenticación: JWT (tokens de 30 días)
  - IA: GPT-4.1-mini (texto) y GPT-4o-mini (visión)

  ---
  1. FLUJO DE MENSAJES (Frontend → Backend → IA → Usuario)

  Usuario escribe mensaje + adjunta archivos
      ↓
  Frontend: handleFormSubmit() → api.uploadFiles() (si hay archivos)
      ↓
  POST /api/chat con { message, attachments }
      ↓
  Backend: chatController.handleChat()
      ├─ Cargar UserProfile y ChatHistory
      ├─ Verificar onboarding (si incompleto → flujo cuestionario)
      ├─ Procesar archivos adjuntos (imágenes, PDFs, texto)
      ├─ Determinar modelo IA (con/sin visión)
      ├─ Generar system prompt personalizado
      ├─ Llamar OpenAI API con historial + contexto
      ├─ Analizar respuesta (detectar documentos, desafíos, PDFs)
      ├─ Guardar en base de datos
      └─ Retornar respuesta al frontend
      ↓
  Frontend: addAiMessage() → renderizar con botones (copiar, PDF, like)

  ---
  2. SISTEMA DE MEMORIA INTELIGENTE

  Componentes clave:

  1. Memory Summary (resumen conversacional):
    - Cada 5 mensajes del asistente → IA resume conversación
    - Se guarda en UserProfile.memorySummary
    - Reemplaza historial completo en system prompt (ahorra tokens)
  2. Perfil de Usuario:
    - 21 preguntas de onboarding → respuestas guardadas
    - IA clasifica en 5 etiquetas:
        - Tipo digestivo, emoción predominante, estilo alimentación, ritmo de vida, prioridad principal
    - Tags se incluyen en cada llamada a IA para personalización
  3. Historial Conversacional:
    - Solo últimos 15 mensajes se envían a IA
    - Resto condensado en memory summary
    - Estructura: { role: 'user'|'assistant', content, attachments, timestamps }

  ---
  3. DETECCIÓN INTELIGENTE DE CONTENIDO

  La IA analiza cada respuesta generada para identificar:

  A) Documentos valiosos (analyzeAndSaveDocument):
  - Planes de nutrición, rutinas de ejercicio, diagnósticos
  - Se guardan en colección PersonalizedDocument
  - Usuario puede recuperarlos desde su biblioteca

  B) Desafíos semanales (analyzeAndSaveChallenge):
  - Detecta retos propuestos
  - Genera PDF automático con título + frase motivacional
  - Guardado en colección Challenge

  C) Contenido descargable (analyzeForDownloadableContent):
  - Determina si respuesta debe ofrecerse como PDF
  - Respuesta incluye pdfData para botón de descarga

  D) Contenido urgente:
  - Keywords: "dolor agudo", "sangre", "fiebre persistente"
  - Activa mensaje de seguridad recomendando atención médica

  ---
  4. SYSTEM PROMPT DINÁMICO

  El prompt del sistema se construye dinámicamente con:

  1. Contexto general (rol del asistente, tono, dominio)
  2. Capacidad de visión (si hay imágenes adjuntas)
  3. Memory summary (resumen de conversaciones previas)
  4. Etiquetas de perfil (personalización por usuario)
  5. Selección de rol (7 roles: nutricionista, coach, psicóloga, etc.)
  6. Triggers temporales:
     - Nuevo día → saludo + check-in diario
     - Nueva semana (7+ días) → revisión semanal

  ---
  5. MANEJO DE ARCHIVOS CON IA

  Tipos soportados:
  - Imágenes (JPG, PNG, HEIC): Análisis visual con GPT-4o-mini
    - Platos de comida, refrigeradores, etiquetas nutricionales, postura
  - PDFs: Extracción de texto con pdf-parse
  - Documentos de texto: Lectura directa

  Flujo:
  Archivo adjunto → multer upload → guardar en /uploads
      ↓
  Convertir a base64 (imágenes) o extraer texto (PDFs/txt)
      ↓
  Incluir en llamada OpenAI como image_url o texto adicional
      ↓
  IA analiza y genera respuesta contextualizada

  ---
  6. BASE DE DATOS (MongoDB)

  Colecciones principales:

  User: { name, email, password (bcrypt), createdAt }
      ↓
  UserProfile: {
      user (ref),
      onboardingCompleted,
      onboardingStep,
      memorySummary,        // ← Clave: resumen IA
      respuestasCuestionario,
      etiquetas,
      lastInteractionDate,
      avatarUrl
  }
      ↓
  ChatHistory: {
      user (ref, unique),
      messages: [
          { role, content, attachments, timestamps }
      ]
  }
      ↓
  PersonalizedDocument: { user, title, content, type, createdAt }
  Challenge: { user, title, quote, filePath, createdAt }
  JournalEntry: { user, date, content, quote }

  ---
  7. AUTENTICACIÓN Y SESIÓN

  // Login/Register
  POST /api/auth/login → JWT token (exp: 30 días)
      ↓
  localStorage.setItem('authToken', token)
      ↓
  Cada request: Authorization: Bearer <token>
      ↓
  Middleware protect() → verifica JWT → req.user = User

  // Validación de sesión
  Frontend: checkExistingSession()
      ├─ Decodificar JWT
      ├─ Verificar expiración
      └─ Redirigir según estado

  ---
  8. ONBOARDING CONVERSACIONAL

  // Flujo corto (3-4 preguntas)
  Paso 0: Botón "[EMPEZAR TEST]"
  Paso 1: "¿Cómo te llamas y desde dónde escribes?"
  Paso 2: "¿Qué síntomas digestivos te preocupan?"
  Paso 3: "¿Has identificado alimentos problemáticos?"
  Paso 4: "¿Cuál es tu mayor motivación?"
      ↓
  onboardingCompleted = true
      ↓
  IA asigna etiquetas de perfil
      ↓
  Genera primer memory summary

  ---
  9. ENDPOINTS API PRINCIPALES

  | Método | Endpoint           | Función              | Auth |
  |--------|--------------------|----------------------|------|
  | POST   | /api/chat          | Enviar mensaje       | JWT  |
  | GET    | /api/chat/history  | Obtener historial    | JWT  |
  | POST   | /api/upload        | Subir archivos       | JWT  |
  | POST   | /api/auth/login    | Login                | No   |
  | POST   | /api/auth/register | Registro             | No   |
  | GET    | /api/user/profile  | Perfil usuario       | JWT  |
  | GET    | /api/documents     | Documentos guardados | JWT  |
  | GET    | /api/challenges    | Desafíos generados   | JWT  |

  ---
  10. CARACTERÍSTICAS ESPECIALES

  1. Análisis de imágenes: GPT-4o-mini con vision para analizar comida, etiquetas
  2. Generación de PDFs: Automática para respuestas valiosas
  3. Sistema de roles dinámico: IA elige su rol por mensaje
  4. Triggers temporales: Saludos diarios, revisiones semanales
  5. Journal personal: Entrada diaria con cita motivacional
  6. Biblioteca de documentos: IA extrae y guarda contenido valioso
  7. Speech-to-text: Reconocimiento de voz integrado
  8. Captura de cámara: Tomar fotos directamente en el chat

  ---
  🎯 PARA REPLICAR EN OTRO PROYECTO:

  Elementos esenciales:

  1. ✅ UserProfile separado de User (para datos dinámicos)
  2. ✅ Memory summary en lugar de historial completo (ahorro de tokens)
  3. ✅ System prompt dinámico con contexto temporal
  4. ✅ Detección inteligente de contenido valioso
  5. ✅ Onboarding conversacional para clasificación de usuario
  6. ✅ Manejo de multimodalidad (texto + imágenes)
  7. ✅ JWT para autenticación persistente

  Flujo mínimo viable:

  User → Login → Onboarding → Tag Assignment → Chat con Memory

● ---
  ¿Necesitas que profundice en alguna parte específica del sistema? Por ejemplo:
  - Código exacto del sistema de memory summary
  - Implementación del análisis de documentos
  - Lógica de triggers temporales
  - Sistema de etiquetado con IA

  This project is a personalized AI-powered chatbot for digestive health and wellness, designed to guide users toward better habits, nutrition, and emotional balance. It combines backend AI processing (via OpenAI) with a frontend interface for interactive chat, file uploads, and additional features like journaling and challenges. The conversational logic is structured around user onboarding, dynamic AI responses, memory retention, and safety protocols.
1. Onboarding Process
   - Trigger: When a new user accesses the chat, they see a welcome message prompting them to start a short test ("EMPEZAR TEST").
   - Flow: Users answer 3-4 initial questions (e.g., name/location, digestive symptoms, problematic foods, motivation). Responses are stored in the user profile.
   - Completion: After onboarding, the system assigns profile tags (e.g., digestive type: slow/fast, emotional state: anxious/motivated) using AI analysis. This creates a baseline for personalization.
   - Fallback: If onboarding is incomplete, the chat defaults to normal flow but lacks full context.
2. Normal Chat Flow
   - User Input: Users send text messages, optionally with attachments (images, text files, PDFs). The frontend handles file uploads, camera captures, and previews.
   - Processing:
     - Attachments are processed: Images are optimized/resized and converted to base64 for AI vision; text files are truncated if too long.
     - Model selection: GPT-4o-mini for messages with images (enables vision analysis); GPT-4.1-mini for text-only.
     - System prompt construction: Includes user profile tags, memory summary (consolidated conversation history), attachment context, and role-specific instructions (e.g., act as a nutritionist, coach, or psychologist based on message analysis).
   - AI Response Generation:
     - OpenAI API call with conversation history (last 15 messages), system prompt, and user message.
     - Response is analyzed for downloadable content (e.g., structured plans) and marked for PDF generation if applicable.
     - Additional analysis: Detects and saves "challenges" (weekly action plans) or "documents" (valuable guides) as separate entities.
   - Output: Responses are categorized (e.g., default text, structured content, questions). Frontend renders them with actions like copy, share, or download.
   - Storage: Messages are saved to chat history; every 5 assistant responses, a memory summary is updated via AI chunking (processing conversation in batches to extract key user details like goals, symptoms, habits).
3. Personalization and Memory
   - Memory Summary: AI consolidates past conversations into bullet-point facts (e.g., objectives, physical symptoms, food preferences). This summary is prioritized in prompts for continuity, ensuring responses aren't generic.
   - Role Adaptation: Each user message is classified by AI into roles (e.g., nutritionist for food-related queries, psychologist for emotional issues), tailoring the response style.
   - Context Integration: Includes attachment details (e.g., image descriptions or file contents) and user profile data for relevant, empathetic advice.
4. Special Features and Safety Measures
   - Urgent Detection: Scans for keywords like "severe pain" or "bleeding"; if detected, responds with advice to seek medical help and redirects from AI guidance.
   - Time-Based Triggers:
     - Daily: Greets users and asks about daily habits (e.g., sleep, food, mood).
     - Weekly: Prompts for progress reviews (achievements, challenges, adjustments).
   - Attachments Handling: Images trigger vision analysis (e.g., food identification, calorie estimates); text/docs are summarized or referenced.
   - Response Enhancements: Structured content (e.g., meal plans) can be downloaded as PDFs. Challenges are auto-generated and saved as downloadable files.
   - Error Handling: Graceful fallbacks for API limits, network issues, or invalid inputs, with user-friendly messages.
5. Frontend Interaction
   - UI Elements: Chat interface with message history, typing indicators, file previews, and modals for features (journal, challenges, library).
   - Event Handling: Supports text input, voice recognition, camera, and file uploads. Messages are sent via API, with real-time rendering.
   - History Loading: On app load, fetches and displays chat history, rebuilding onboarding if needed.
6. Backend Architecture
   - Routes/Controllers: Handles chat (POST for messages, GET for history), uploads, and user data.
   - Models: ChatHistory (messages with attachments), UserProfile (onboarding data, memory summary), PersonalizedDocument/Challenge (saved content).
   - AI Integration: OpenAI for all analysis (tagging, summarization, response generation). Uses JSON-structured prompts for consistency.
This logic creates a supportive, adaptive conversation that evolves with user data, emphasizing safety, personalization, and actionable guidance for digestive wellness. The app avoids medical diagnoses, focusing on habits and motivation.

SI LAS SUGERENCIAS SON DEMASIADO LARGAS PARA QUE ENTREN EN CADA VIÑETA PODEMOS REDUCIR EL TAMAÑO DE LAS LETRAS
MENSAJE DE BIENVENIDA – VERSIÓN FINAL PREMIUM (con tono humano y profesional)
(NOMBRE)   bienvenida a objetivo vientre plano 



Antes de preparar tu plan personalizado necesito conocerte de verdad.
Vamos a recorrer juntos un análisis completo: digestivo, emocional, físico, alimentario, social y de hábitos.

Nos tomamos muy en serio todo este proceso, y por eso es importante recopilar información detallada.
Cuanto más precisa sea tu respuesta, más exactas serán mis recomendaciones a diario.

No hay prisa.
No tienes que contestar todo seguido. Puedes avanzar a tu ritmo, detenerte cuando lo necesites y volver más tarde.

En cada pregunta verás sugerencias para ayudarte, pero si lo prefieres,
puedes responder con tus propias palabras en cualquier momento.

Y recuerda: si te surge alguna duda, también puedes preguntarme. Estoy aquí contigo para acompañarte paso a paso.

Cuando estés listo/a, empezamos.

💬 CUÑA INFORMATIVA – BLOQUE 1 (Digestivo)
Antes de empezar, quiero explicarte algo importante.
La digestión nunca falla: siempre deja señales.

Los horarios, la intensidad de tus síntomas, cómo reaccionas a ciertos alimentos y cuánto duran las molestias…
todo esto forma un mapa muy claro sobre qué está ocurriendo en tu sistema digestivo.

Por eso este primer bloque es tan importante.
Aquí vamos a identificar patrones que muchas veces pasan desapercibidos, pero que explican por qué tu barriga reacciona como reacciona.

No tengas prisa: responde con calma y recuerda que
puedes escribir tus respuestas con tus propias palabras siempre que quieras.

🔷 PREGUNTA 1
¿Cuál es el síntoma digestivo que más te está afectando estos días?

Sugerencias:

“Hinchazón constante en la zona abdominal”

“Muchos gases y digestiones demasiado lentas”

“Dolor o presión justo después de las comidas”

“Alterno estreñimiento y diarrea varias veces”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias por contármelo. Esta información es fundamental para entender por dónde empezar contigo.

🔷 PREGUNTA 2
¿En qué momento del día suelen aparecer tus molestias digestivas con más intensidad?

Sugerencias:

“Por la mañana después de tomar algo o desayunar”

“A mitad del día o justo al terminar la comida principal”

“Por la tarde cuando llevo varias horas activo/a”

“Por la noche o al acostarme, cuando intento relajarme”

“Puedes escribir tu respuesta con tus propias palabras.”



Transición:

Perfecto, ya voy identificando patrones importantes en tu digestión.

🔷 PREGUNTA 3
¿Qué alimentos sospechas que te provocan peor digestión o inflamación?

Sugerencias:

“Lácteos como queso, yogur, leche o derivados”

“Harinas, pan, pasta o alimentos con gluten”

“Frutas o verduras que me generan gases fácilmente”

“Legumbres, fritos o comidas muy grasas y pesadas”

“Puedes escribir tu respuesta con tus propias palabras.”



Transición:

Gracias, esta parte es clave para ajustar tu alimentación sin agobios.

🔷 PREGUNTA 4
¿Cómo describirías tus digestiones en general durante la última semana?

Sugerencias:

“Muy pesadas y lentas, tardo horas en sentir alivio”

“Irregulares: algunos días bien y otros muy mal”

“Normales pero con molestia después de ciertas comidas”

“Demasiado rápidas, casi sin llegar a digerir bien”

“Puedes escribir tu respuesta con tus propias palabras.”



Transición:

Entiendo. Esto me ayuda a medir cómo está funcionando tu sistema digestivo últimamente.

🔷 PREGUNTA 5
Cuando tienes un episodio fuerte de molestias (hinchazón, dolor, gases…), ¿cuánto suele durar?

Sugerencias:

“Entre 30 minutos y una hora aproximadamente”

“Varias horas, a veces hasta media tarde o noche”

“Me dura prácticamente todo el día completo”

“Depende del día: a veces poco y otras muchísimo”

“Puedes escribir tu respuesta con tus propias palabras.”



Transición final del bloque:

Gracias por compartir todo esto conmigo.
Con esta información ya puedo empezar a entender cómo responde tu digestión y qué patrones influyen más en tus molestias.





💬 CUÑA INFORMATIVA – BLOQUE 2 (Emocional)
Ahora vamos a profundizar en la parte emocional.
La barriga y las emociones están totalmente conectadas:
el estrés, la presión mental y la ansiedad pueden inflamar tanto como un alimento.

Muchas personas viven meses o años con molestias digestivas sin darse cuenta de que su estado emocional es uno de los factores más importantes.

No buscamos juzgarte ni analizar tu vida.
Solo necesito entender cómo te sientes por dentro para ajustar tu acompañamiento de una forma realista y humana.

Recuerda que puedes responder con calma, y si lo prefieres,
puedes escribir tus respuestas con tus propias palabras.

Cuando estés preparado/a, continuamos.

🔷 PREGUNTA 1
¿Cómo describirías tu nivel de estrés en las últimas dos semanas?

Sugerencias:

“Estrés alto casi todos los días recientemente”

“Estrés moderado pero constante a lo largo del día”

“Momentos puntuales de estrés que puedo controlar”

“Muy poco estrés o sensación general de tranquilidad”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. El nivel de estrés suele influir directamente en la digestión.

🔷 PREGUNTA 2
¿Sientes que tus emociones afectan a tu barriga o a tus digestiones?

Sugerencias:

“Sí, noto inflamación en días de mucha tensión emocional”

“A veces, sobre todo cuando tengo preocupaciones fuertes”

“Muy pocas veces siento una conexión directa entre ambas”

“No noto relación, mis emociones no afectan tanto mi cuerpo”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entiendo, esto me ayuda a ver cómo reacciona tu cuerpo frente a tus emociones.

🔷 PREGUNTA 3
¿Cómo te sientes contigo mismo/a cuando tu digestión no va bien?

Sugerencias:

“Me siento frustrado/a y con poca paciencia conmigo mismo/a”

“Me desanimo porque siento que no tengo control del cuerpo”

“Me afecta un poco, pero intento llevarlo con calma”

“Casi no me afecta emocionalmente, lo gestiono bien”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias por compartirlo. Entender tu vivencia emocional es clave.

🔷 PREGUNTA 4
¿Cómo han sido tus niveles de ansiedad últimamente?

Sugerencias:

“Ansiedad alta, especialmente en momentos de presión”

“Ansiedad moderada que aparece de vez en cuando”

“Ansiedad baja o casi inexistente en general”

“Depende de la semana, tengo altibajos marcados”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto, ya voy viendo cómo se mueve tu estado interno.

🔷 PREGUNTA 5
¿Sueles notar tensión en el cuerpo (pecho, abdomen, cuello) cuando algo te preocupa?

Sugerencias:

“Sí, noto mucha tensión en el abdomen cuando me preocupo”

“Siento presión en el pecho o en el estómago frecuentemente”

“Solo en momentos muy concretos de estrés fuerte”

“No suelo sentir tensión física cuando estoy preocupado/a”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final del bloque:

Gracias por abrirte y compartir todo esto conmigo.
Ya tengo una visión clara de cómo influyen tus emociones en tu digestión y en tu bienestar general.





💬 CUÑA INFORMATIVA – BLOQUE 3 (Físico / Energía)
El estado físico influye directamente en cómo digieres.
Cuando duermes poco, cuando estás cansado/a o cuando el cuerpo acumula tensión, la digestión se vuelve más lenta y más sensible.

Por eso ahora vamos a ver cómo está respondiendo tu cuerpo en general: energía, descanso y ritmo diario.
Esta parte nos ayuda a ajustar tus recomendaciones para que no te sientas forzado/a ni agotado/a.



🔷 PREGUNTA 1
¿Cómo describirías tu nivel de energía a lo largo del día?

Sugerencias:

“Energía baja casi todo el día, me cuesta activar el cuerpo”

“Energía irregular: tengo subidas y bajadas marcadas”

“Buena energía por la mañana y más cansancio por la tarde”

“Energía estable durante todo el día en general”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. Tu nivel de energía me ayuda a entender cómo responde tu cuerpo a tu ritmo diario.

🔷 PREGUNTA 2
¿Cómo está siendo tu descanso nocturno últimamente?

Sugerencias:

“Me cuesta dormir y me despierto varias veces por la noche”

“Duermo pero me levanto cansado/a, sin sensación de descanso”

“Duermo bien algunos días, pero otros descanso muy mal”

“Mi sueño es estable y me levanto con buena energía”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. El descanso influye directamente en tu digestión y en tu estado emocional.

🔷 PREGUNTA 3
¿Sueles sentir tensión física en alguna parte del cuerpo? (cuello, espalda, pecho o abdomen)

Sugerencias:

“Sí, tensión constante en el abdomen o la zona del estómago”

“Siento mucha tensión en cuello y espalda durante el día”

“Tensión puntual cuando estoy estresado/a o preocupado/a”

“Casi nunca siento tensión física general en el cuerpo”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entendido. La tensión corporal puede influir en la inflamación y en la digestión.

🔷 PREGUNTA 4
¿Qué nivel de movimiento tienes en un día normal?

Sugerencias:

“Muy poco movimiento, paso muchas horas sentado/a”

“Movimiento moderado: camino algo pero no hago ejercicio”

“Actividad física regular varias veces por semana”

“Trabajo físico o movimiento constante durante todo el día”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto, esto me ayuda a ajustar tus hábitos sin sobrecargar tu cuerpo.

🔷 PREGUNTA 5
¿Sientes que tu cuerpo retiene líquidos o se inflama más de lo normal?

Sugerencias:

“Sí, noto retención e inflamación en piernas, abdomen o manos”

“A veces siento retención pero no es constante”

“Muy poca retención, solo en días específicos”

“No suelo tener retención ni inflamación corporal general”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias por compartir todo esto. Con este bloque ya puedo entender mejor cómo responde tu cuerpo a tu ritmo diario y a tus niveles de energía.





💬 CUÑA INFORMATIVA – BLOQUE 4 (Alimentación)
La forma en la que comes influye tanto como lo que comes.
No se trata solo de alimentos “buenos o malos”, sino de horarios, cantidades, velocidad al comer, tipo de dieta y cómo te sientes antes y después de cada comida.

Este bloque nos ayuda a identificar qué patrones alimentarios pueden estar favoreciendo o empeorando tus digestiones.
No busco que cambies tu forma de comer ahora mismo, solo quiero entender cómo es tu alimentación en la vida real.



🔷 PREGUNTA 1
¿Cuál describirías como tu estilo de alimentación habitual?

Sugerencias:

“Comida variada intentando mantener una alimentación equilibrada”

“Alimentación alta en proteínas al estilo fitness o similar”

“Alimentación vegetariana o vegana en el día a día”

“Como de todo sin restricciones ni reglas definidas”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Genial, esto me ayuda a adaptar tus menús sin cambiar tu estilo de vida.

🔷 PREGUNTA 2
¿Cómo suelen ser tus horarios de comida a lo largo del día?

Sugerencias:

“Hago comidas irregulares según el día y cómo vaya de tiempo”

“Mantengo horarios fijos para desayunar, comer y cenar”

“Suelo comer tarde o a deshora por mi ritmo de vida”

“Hago ayuno intermitente o una ventana de alimentación corta”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Los horarios son clave para estabilizar tus digestiones.

🔷 PREGUNTA 3
¿Tiendes a comer rápido, despacio o depende del momento?

Sugerencias:

“Como muy rápido casi siempre, especialmente entre semana”

“Suelo comer a un ritmo normal, sin mucha prisa”

“Como despacio y trato de masticar bien los alimentos”

“Depende del día, a veces con calma y a veces con prisa”

“Puedes escribirlo con tus propias palabras si lo prefieres.”

Transición:

Gracias. La velocidad al comer afecta directamente la hinchazón.

🔷 PREGUNTA 4
¿Con qué frecuencia recurres a alimentos procesados, fritos o comidas muy pesadas?

Sugerencias:

“Muy a menudo, por comodidad o falta de tiempo para cocinar”

“Algunas veces por semana dependiendo de mi rutina diaria”

“Solo en fines de semana o momentos puntuales”

“Rara vez, prácticamente no consumo alimentos pesados”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto me ayuda a ver qué tipo de comidas pueden estar influyendo más en tu digestión.

🔷 PREGUNTA 5
¿Sueles repetir mucho los mismos alimentos durante la semana?

Sugerencias:

“Sí, suelo comer siempre lo mismo por comodidad o costumbre”

“Repito bastantes alimentos durante la semana”

“Intento variar pero a veces termino comiendo cosas similares”

“Varío bastante, me gusta cambiar mis comidas a menudo”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias por compartirlo. Con este bloque ya puedo empezar a ver qué tipo de alimentación encaja mejor contigo sin presión ni restricciones.





💬 CUÑA INFORMATIVA – BLOQUE 5 (Social)
La vida social influye muchísimo en la digestión y en los hábitos.
Cenas fuera, eventos, fines de semana y el ambiente familiar pueden cambiar por completo cómo comes y cómo te sientes.

No se trata de evitar tu vida social, sino de entenderla para que tu acompañamiento sea realista, flexible y adaptado a tu día a día.

No tienes que justificar nada. Solo comparte lo que encaje con tu vida real.

🔷 PREGUNTA 1
¿Con qué frecuencia sueles comer fuera de casa (bares, restaurantes, comida rápida, pedidos)?

Sugerencias:

“Varias veces por semana debido a mi trabajo o rutina diaria”

“Una o dos veces por semana como parte de mi vida social”

“Solo en fines de semana o momentos puntuales”

“Casi nunca como fuera, la mayoría de comidas son en casa”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto me ayuda a ajustar tus recomendaciones sin limitar tu vida social.

🔷 PREGUNTA 2
¿Cómo son normalmente tus fines de semana en cuanto a comida y horarios?

Sugerencias:

“Más desordenados: suelo cambiar horarios y tipos de comida”

“Bastante similares a los días entre semana”

“Salgo a comer o cenar y cambio completamente la rutina”

“Depende mucho del plan que tenga cada fin de semana”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. Los fines de semana suelen marcar muchos patrones digestivos.

🔷 PREGUNTA 3
¿Sientes que tu entorno (pareja, familia, amigos) influye en cómo comes?

Sugerencias:

“Sí, mi entorno influye mucho en mis decisiones al comer”

“A veces me dejo llevar por lo que comen los demás”

“Muy poco, suelo mantener mis decisiones sin problema”

“Depende de la situación, pero a veces sí me afecta”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entiendo. El entorno es un factor clave para evitar recaídas.

🔷 PREGUNTA 4
¿Te sientes presionado/a socialmente a comer o beber cosas que no te sientan bien?

Sugerencias:

“Sí, me cuesta decir que no en reuniones sociales”

“A veces, dependiendo de la situación o la compañía”

“Muy pocas veces, suelo manejarlo bien”

“No, nunca me siento presionado/a en lo social”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto nos ayudará a planificar estrategias para que no te afecte tanto.

🔷 PREGUNTA 5
¿Sueles sentirte diferente o incómodo/a por tus hábitos cuando estás con otras personas?

Sugerencias:

“Sí, me siento diferente y a veces me da vergüenza”

“A veces, dependiendo del grupo o la situación”

“Muy pocas veces, lo llevo bastante bien”

“No, no me afecta en absoluto estar con otras personas”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias por ser tan claro/a en este bloque.
Con esta información puedo adaptar tu acompañamiento a tu vida social sin limitarte ni hacerte sentir fuera de lugar.





💬 CUÑA INFORMATIVA – BLOQUE 6 (Laboral / Ritmo de vida)
Tu trabajo y tu ritmo de vida influyen directamente en tu digestión y en tu forma de comer.
No es lo mismo tener jornadas largas, turnos cambiantes, mucho estrés o poco tiempo para cocinar, que tener un horario más estable.

Aquí no buscamos cambiar tu forma de trabajar, sino adaptar tu plan a tu vida real, para que no te resulte imposible mantenerlo.



🔷 PREGUNTA 1
¿Cómo describirías tu tipo de trabajo o actividad diaria principal?

Sugerencias:

“Trabajo sedentario, paso muchas horas sentado/a”

“Trabajo activo con bastante movimiento físico diario”

“Jornada mixta: parte sentado/a y parte en movimiento”

“Trabajo con horarios muy cambiantes o irregulares”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto, esto me ayuda a ver cómo responde tu cuerpo a tu tipo de actividad.

🔷 PREGUNTA 2
¿Cómo son tus niveles de estrés durante tu jornada laboral?

Sugerencias:

“Estrés alto casi todos los días en el trabajo”

“Estrés moderado que puedo manejar la mayoría de días”

“Estrés bajo o solo en momentos puntuales”

“Depende mucho de la carga laboral de cada día”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. El estrés laboral suele ser uno de los mayores detonantes digestivos.

🔷 PREGUNTA 3
¿Tienes tiempo para comer con calma durante tu día laboral?

Sugerencias:

“No, suelo comer rápido por falta de tiempo”

“A veces puedo comer tranquilo/a, pero no siempre”

“Sí, tengo tiempo suficiente para comer sin prisa”

“Depende del día, hay jornadas muy impredecibles”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entendido. Esto influye muchísimo en tu hinchazón y en tu digestión.

🔷 PREGUNTA 4
¿Puedes mantener horarios más o menos estables para comer durante la semana?

Sugerencias:

“No, mis horarios cambian mucho cada día”

“Más o menos, aunque a veces se descolocan”

“Sí, mis horarios son bastante estables entre semana”

“Mis comidas dependen totalmente del ritmo laboral”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto me ayuda a ajustar tus recomendaciones sin que supongan un esfuerzo extra.

🔷 PREGUNTA 5
¿Cómo te sientes físicamente al final de tu jornada laboral?

Sugerencias:

“Muy cansado/a, siento agotamiento físico y mental”

“Moderadamente cansado/a, pero lo llevo bien”

“Con bastante energía incluso después de trabajar”

“Depende mucho del día y de la carga de trabajo”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias por compartirlo. Con este bloque puedo ajustar tu plan a tu realidad diaria, evitando exigencias que no encajarían con tu ritmo de vida





💬 CUÑA INFORMATIVA – BLOQUE 7 (Bienestar interno)
El cuerpo no solo digiere comida: también digiere emociones, pensamientos y experiencias.
Cuando no tenemos espacios de calma, el sistema nervioso se mantiene en alerta y la digestión se vuelve más sensible.

Este bloque nos ayuda a entender tu nivel de bienestar interno, tu capacidad de desconectar y cómo se relaciona todo esto con tu digestión.



🔷 PREGUNTA 1
¿Cómo describirías tu nivel de calma o equilibrio interior en el día a día?

Sugerencias:

“Me cuesta mucho encontrar momentos de calma real”

“Tengo algo de calma, pero mi mente va muy acelerada”

“Consigo cierta tranquilidad, aunque depende del día”

“Me siento bastante equilibrado/a en general”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias, esto me ayuda a entender cómo se mueve tu estado interno.

🔷 PREGUNTA 2
¿Sueles practicar alguna actividad que te ayude a relajarte? (respiración, caminar, meditar, etc.)

Sugerencias:

“Sí, practico respiración, meditación o técnicas de calma”

“Camino o salgo a despejarme cuando lo necesito”

“A veces hago algo para relajarme, pero no es constante”

“No practico nada concreto para relajarme”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto influye mucho en tu digestión y en tu energía.

🔷 PREGUNTA 3
¿Te resulta fácil desconectar mentalmente al final del día?

Sugerencias:

“Me cuesta mucho desconectar, sigo pensando en todo”

“A veces lo consigo, pero depende del día”

“Lo logro sin demasiada dificultad la mayoría de días”

“Desconecto muy bien, no suelo darle vueltas a las cosas”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entiendo. Esto afecta directamente al estado del sistema nervioso.

🔷 PREGUNTA 4
¿Sueles sentirte conectado/a contigo mismo/a, con tus emociones y con tu cuerpo?

Sugerencias:

“Me cuesta mucho conectar conmigo y entender cómo me siento”

“A veces conecto, pero suele ser en momentos puntuales”

“Suelo estar consciente de mis emociones y sensaciones”

“Sí, tengo bastante conexión con lo que siento y necesito”

“Puedes expresar tu respuesta con tus propias palabras.”

Transición:

Gracias. Esto me ayuda a calibrar qué tipo de apoyo te funcionará mejor.

🔷 PREGUNTA 5
¿Dirías que necesitas más momentos de paz o de descanso mental en tu vida?

Sugerencias:

“Sí, necesito urgentemente más paz y desconexión”

“Creo que sí, me vendría bien tener más momentos para mí”

“A veces, pero lo gestiono relativamente bien”

“No lo veo necesario, ya tengo suficiente calma interna”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias por abrirte en este bloque. Con esto puedo adaptar tu acompañamiento también a tu bienestar interno, no solo a tu digestión.





💬 CUÑA INFORMATIVA – BLOQUE 8 (Objetivos)
Para acompañarte de verdad necesito saber cuál es tu objetivo.
No todos buscamos lo mismo: algunas personas quieren reducir hinchazón, otras mejorar energía, otras regular su tránsito, otras recuperar confianza en su cuerpo.

Entender qué es lo que tú quieres lograr me permite adaptar tu acompañamiento y marcar el ritmo adecuado para ti.

🔷 PREGUNTA 1
¿Cuál es tu objetivo principal al estar aquí conmigo?

Sugerencias:

“Reducir mi hinchazón y sentirme más ligero/a cada día”

“Mejorar mis digestiones y evitar molestias después de comer”

“Regular mi tránsito y tener una digestión más estable”

“Ganar energía y sentirme mejor físicamente en general”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto define la dirección principal de tu acompañamiento.

🔷 PREGUNTA 2
¿Qué tan urgente sientes que es para ti conseguir este objetivo?

Sugerencias:

“Muy urgente, necesito un cambio cuanto antes”

“Bastante importante, quiero mejorar lo antes posible”

“Importante, pero puedo avanzar a un ritmo tranquilo”

“No es urgente, quiero mejorar paso a paso”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. Esto me ayuda a ajustar el ritmo del proceso a tu necesidad real.

🔷 PREGUNTA 3
¿Qué es lo que más te frustra de tu situación actual?

Sugerencias:

“La sensación de hinchazón constante que no puedo controlar”

“Comer algo y no saber si me va a sentar bien o mal”

“La falta de energía y la sensación de agotamiento”

“Haber probado cosas y no ver resultados duraderos”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias por compartirlo. Esto ayuda a encontrar soluciones más específicas para ti.

🔷 PREGUNTA 4
¿Qué te haría sentir que realmente estás avanzando?

Sugerencias:

“Notar menos inflamación al final del día”

“Poder comer sin miedo ni molestias digestivas fuertes”

“Tener más energía para hacer mis actividades diarias”

“Sentirme más ligero/a y con mejor bienestar general”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto me permite entender qué señales de progreso son importantes para ti.

🔷 PREGUNTA 5
¿Cuánto compromiso estás dispuesto/a a poner en este proceso?

Sugerencias:

“Estoy totalmente comprometido/a, quiero mejorar de verdad”

“Estoy dispuesto/a a hacer cambios importantes si son realistas”

“Quiero avanzar, pero con pasos pequeños y sostenibles”

“Quiero mejorar, pero me cuesta mantener la constancia”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias. Con este bloque ya puedo adaptar tu acompañamiento al ritmo, la motivación y el objetivo que tienes en mente.





💬 CUÑA INFORMATIVA – BLOQUE 9 (Hábitos y constancia)
Tus resultados no dependen solo de lo que comas, sino de los hábitos que puedas mantener en tu día a día.
Cada persona tiene un nivel distinto de constancia, y eso es totalmente normal.

Este bloque me ayuda a adaptar tu acompañamiento a tu ritmo real, para evitar frustraciones y crear un progreso estable y sostenible.

🔷 PREGUNTA 1
¿Cómo describirías tu nivel de constancia cuando intentas cambiar algún hábito?

Sugerencias:

“Me cuesta mantener cambios, suelo abandonar fácilmente”

“Puedo mantener hábitos un tiempo, pero luego me cuesta seguir”

“Soy constante si tengo apoyo o seguimiento”

“Soy bastante constante, mantengo lo que me propongo”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. Esto me ayuda a ajustar el tipo de apoyo que te daré cada día.

🔷 PREGUNTA 2
¿Tienes alguna rutina diaria establecida (mañana, tarde o noche)?

Sugerencias:

“No tengo rutinas, cada día es distinto y caótico”

“Tengo algunas rutinas pero no siempre las cumplo”

“Sí, tengo rutinas básicas que suelo mantener”

“Tengo rutinas muy establecidas y organizadas”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto me ayuda a ver dónde integrar pequeños hábitos sin presionarte.

🔷 PREGUNTA 3
¿Qué hábitos saludables ya has intentado en el pasado?

Sugerencias:

“He intentado llevar una alimentación más ordenada”

“He probado hacer ejercicio o caminar con regularidad”

“He intentado mejorar mi sueño o mis horarios”

“He probado muchos hábitos pero ninguno me duró mucho”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entiendo. Con esto evito repetir cosas que ya no te funcionaron.

🔷 PREGUNTA 4
¿Qué es lo que más te cuesta mantener cuando intentas mejorar tu bienestar?

Sugerencias:

“Ser constante cuando no veo resultados rápidos”

“Organizarme con comidas y horarios durante la semana”

“Mantener la motivación en días de estrés o cansancio”

“Recordar los pequeños hábitos que debo aplicar”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. Esto me permite diseñar recordatorios y hábitos adaptados a ti.

🔷 PREGUNTA 5
¿Cuánto tiempo real al día crees que puedes dedicar a mejorar tu bienestar?

Sugerencias:

“Muy poco tiempo, días bastante complicados”

“Unos minutos al día, pero de forma constante”

“Entre 10 y 20 minutos diarios sin problema”

“Puedo dedicar más tiempo si lo necesito realmente”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Perfecto. Con este bloque puedo adaptar tus hábitos y recordatorios a tu ritmo real, sin exigirte más de lo que puedes dar.





BLOQUE 10 — IDENTIDAD PERSONAL / CONTEXTO VITAL (VERSIÓN FINAL)
💬 CUÑA INFORMATIVA – BLOQUE 10 (Identidad personal)
Para acompañarte bien necesito situarme en tu contexto: tu momento vital, cómo te ves a ti mismo/a y cómo es tu estilo de vida general.
No se trata de datos técnicos, sino de comprender en qué punto estás para adaptar el tono, el ritmo y la dirección del acompañamiento.

🔷 PREGUNTA 1
¿En qué etapa de tu vida sientes que te encuentras ahora mismo?

Sugerencias:

“En un momento de cambio y necesidad de mejorar mi salud”

“En una etapa estable pero con ganas de avanzar más”

“En un periodo complicado a nivel personal o emocional”

“En una etapa de crecimiento personal y enfoque en mí”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias, esto me ayuda a entender desde dónde estás empezando.

🔷 PREGUNTA 2
¿Cómo describirías tu estilo de vida actual en general?

Sugerencias:

“Bastante acelerado, con muy poco tiempo para mí”

“Activo pero con algunos momentos de calma y descanso”

“Relativamente tranquilo, con una rutina estable”

“Muy variable, mis días cambian mucho de un día a otro”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto influye en cómo adaptaremos tus objetivos y hábitos diarios.

🔷 PREGUNTA 3
¿Cómo te ves a ti mismo/a en cuanto a salud y bienestar?

Sugerencias:

“Me veo bastante desalineado/a y quiero mejorar”

“Siento que tengo cosas por mejorar pero estoy motivado/a”

“Me considero una persona bastante saludable en general”

“No lo tengo claro, mi percepción cambia según el día”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Entiendo. Esto me ayuda a conocer tu punto de partida interno.

🔷 PREGUNTA 4
¿Cómo describirías tu relación contigo mismo/a en este momento?

Sugerencias:

“Me cuesta cuidarme y priorizarme en mi día a día”

“Intento cuidarme, pero a veces me dejo en segundo plano”

“Tengo una relación bastante buena conmigo mismo/a”

“Depende del momento, tengo altibajos frecuentes”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias por compartirlo. Esta parte es clave para el acompañamiento emocional.

🔷 PREGUNTA 5
¿Hay algo en tu vida personal que esté influyendo en tu bienestar en este momento?

Sugerencias:

“Sí, estoy pasando por cambios o situaciones difíciles”

“Algunas cosas me influyen, pero intento gestionarlas”

“Pocas cosas afectan mi bienestar actualmente”

“No siento que haya algo personal afectándome ahora mismo”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Perfecto. Con este bloque ya tengo una visión clara de tu contexto vital y cómo acompañarte de la forma más humana posible.





💬 CUÑA INFORMATIVA – BLOQUE 11 (Historial médico)
Algunos medicamentos y diagnósticos previos pueden influir muchísimo en la digestión:
antiácidos, ansiolíticos, antibióticos recientes, tratamientos hormonales, intolerancias, operaciones…

No buscamos hacer un diagnóstico médico, sino adaptar tu acompañamiento para que encaje con tu realidad física y con tu historial.

Comparte solo lo que te apetezca, pero recuerda que esta parte ayuda a que todo sea mucho más preciso.

🔷 PREGUNTA 1
¿Tienes algún diagnóstico digestivo previo que debamos tener en cuenta?

Sugerencias:

“Sí, tengo diagnóstico de colon irritable o SII”

“Gastritis, reflujo o problemas estomacales recurrentes”

“Intolerancias o sospechas de intolerancias alimentarias”

“No tengo diagnósticos digestivos conocidos”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto, esta información es muy importante para personalizar tu acompañamiento.

🔷 PREGUNTA 2
¿Actualmente tomas algún medicamento de forma frecuente?

Sugerencias:

“Antiácidos, protectores gástricos o medicación digestiva”

“Ansiolíticos, antidepresivos o reguladores del ánimo”

“Anticonceptivos, tratamientos hormonales o similares”

“No tomo ningún medicamento de forma regular”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias. Muchos medicamentos pueden influir en la digestión y en la energía diaria.

🔷 PREGUNTA 3
¿Has tomado antibióticos en los últimos meses?

Sugerencias:

“Sí, he tomado antibióticos en los últimos treinta días”

“Sí, tomé antibióticos hace dos o tres meses”

“Hace bastante tiempo que no tomo antibióticos”

“No recuerdo haber tomado antibióticos recientemente”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Perfecto. Esto ayuda a entender cambios en tu flora intestinal.

🔷 PREGUNTA 4
¿Has tenido alguna operación o intervención que pueda influir en tu digestión?

Sugerencias:

“Sí, he tenido operaciones abdominales o digestivas”

“He tenido intervenciones pero no afectaron mi digestión”

“Ninguna operación que haya influido en mi sistema digestivo”

“Tuve operaciones hace años pero sin cambios digestivos”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición:

Gracias por compartirlo. Esto me permite ajustar recomendaciones con más precisión.

🔷 PREGUNTA 5
¿Tienes alguna alergia, intolerancia o sensibilidad alimentaria conocida?

Sugerencias:

“Sí, alergias o intolerancias diagnosticadas por un profesional”

“Sensibilidades que sospecho pero no están confirmadas”

“No tengo alergias ni intolerancias conocidas”

“Estoy en proceso de averiguarlo o haciendo pruebas”

“Puedes escribir tu respuesta con tus propias palabras.”

Transición final:

Gracias. Con esta información puedo asegurarme de que tu acompañamiento sea seguro, adaptado y coherente con tu situación física.

💬 MENSAJE FINAL TRAS COMPLETAR EL CUESTIONARIO (Versión Premium Definitiva)
Gracias por abrirte y compartir todo esto conmigo.
Ya tengo una visión completa de tu digestión, tus emociones, tu energía, tu entorno y tu estilo de vida.

Todo lo que me has contado es importante. Cada detalle suma.
A partir de este momento, tu acompañamiento empieza de verdad.

Voy a utilizar toda esta información para adaptarme a ti:
a tus horarios, tu nivel de energía, tu alimentación, tu ritmo emocional y tu objetivo principal.

No tengo prisa. Vamos paso a paso.
Yo te acompaño, tú marcas el ritmo.

Cuando quieras, dime cómo te gustaría empezar: 

👉 con un consejo digestivo,
👉 una sugerencia de menú,
👉 un hábito sencillo para hoy,
👉 o simplemente cuéntame cómo te estás sintiendo ahora mismo.
Estoy contigo 24/7. Vamos a hacerlo juntos.

DOCUMENTO PARA KEVIN – LÓGICA COMPLETA DEL CHAT 24/7 (CLARA)
Versión lista para copiar/pegar en su email.

1. IDENTIDAD Y ROL DE “CLARA”
Clara no es un bot.
Debe comportarse como una profesional multidisciplinar de alto nivel, con formación en:

digestivo

nutrición adaptada

psicología emocional básica

hábitos

bienestar interno

análisis de síntomas digestivos

acompañamiento humano

gestión del estrés

salud intestinal

motivación conductual

espiritualidad práctica y calma mental

Tono:

humano, cálido, empático

profesional, nunca frío

directo pero suave

nada técnico

cercano, sin exagerar

siempre enfocado en la mejora real del usuario

Clara debe sonar como una asistente experta que conoce al usuario profundamente y que evoluciona con él.



APARTIR DE AQUI AY QUE IMPLEMENTAR UNA LOGICA CONVERSACIONAL

 La lógica conversacional debe replicar el sistema de ChatGPT: comprensión del contexto, respuestas adaptativas, cambio dinámico de rol según la necesidad del usuario y micro-ajustes frase a frase para mantener una interacción natural y creíble.  