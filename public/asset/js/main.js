// Seleccionar elementos
let userInput = document.querySelector("#inputText");
let resButton = document.querySelector("#resButton");
const chatbox = document.querySelector(".chat__messages");
const userId = "anon-" + Date.now(); // ← aquí estaba el error (coma reemplazada por punto y coma)

// Función para mostrar mensajes
function displayMessages(msg, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("chat__message");
    msgDiv.classList.add(sender === "user" ? "chat__message--user" : "chat__message--bot");
    if (sender === "bot") {
        msgDiv.classList.add("chat__message--ia");
    }
    msgDiv.textContent = msg;

    chatbox.appendChild(msgDiv);
    
    // Smooth scroll down
    chatbox.scrollTo({
        top: chatbox.scrollHeight,
        behavior: 'smooth'
    });
}

// Enviar mensaje al backend
async function sendMessage() {
    const myMessage = userInput.value.trim();
    if (!myMessage) return;

    userInput.value = "";

    // Mostrar mensaje del usuario
    displayMessages(myMessage, "user");

    // Mostrar mensaje de espera
    displayMessages("Pensando...", "bot");

    try {
        const response = await fetch("https://asistente-nutricional-ia.onrender.com/api/nutri-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: userId,
                message: myMessage
            })
        });

        const data = await response.json();

        // Reemplazar el mensaje de "Pensando..." por la respuesta real
        const botMessages = chatbox.querySelectorAll(".chat__message--bot");
        const lastBotMsg = botMessages[botMessages.length - 1];

        if (lastBotMsg) {
            lastBotMsg.textContent = data.reply;

               if (data.reply.length >= 100) {

            // Enable HTML inside Markdown for tables
            const md = new markdownit({ html: true });

            const htmlContent = md.render(data.reply);

            lastBotMsg.innerHTML = htmlContent;

            // Agrupar filas de la tabla si existe column "Día" (índice 0)
            const table = lastBotMsg.querySelector("table");
            if (table) {
                mergeTableCells(table, 0);
            }

        }else{
            lastBotMsg.textContent = data.reply;
        }

        // Auto-scroll after markdown renders
        chatbox.scrollTo({
            top: chatbox.scrollHeight,
            behavior: 'smooth'
        });


        
        } else {
            displayMessages(data.reply, "bot");
        }

     



    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        displayMessages("Hubo un problema al contactar al servidor. Revisa si está encendido.", "bot");
    }
}

// Eventos
resButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Función para agrupar celdas continuas en la misma columna (ej. para la columna "Día")
function mergeTableCells(table, columnIndex) {
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    let previousCell = null;
    let rowspanCounter = 1;

    Array.from(tbody.querySelectorAll("tr")).forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length <= columnIndex) return;

        const currentCell = cells[columnIndex];
        const currentText = currentCell.textContent.trim();

        if (previousCell && previousCell.textContent.trim() === currentText) {
            rowspanCounter++;
            previousCell.setAttribute("rowspan", rowspanCounter);
            currentCell.style.display = "none"; // Ocultar celda duplicada
        } else {
            previousCell = currentCell;
            rowspanCounter = 1;

            // Estilos para destacar la celda agrupada
            previousCell.style.verticalAlign = "middle";
            previousCell.style.fontWeight = "600";
            previousCell.style.color = "var(--primary-dark)";
            previousCell.style.borderRight = "1px solid var(--border-color)";
            previousCell.style.backgroundColor = "white"; // Aseguramos que destaque sobre el estilo 'striped' de CSS
        }
    });
}
