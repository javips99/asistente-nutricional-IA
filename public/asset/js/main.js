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
    chatbox.scrollTop = chatbox.scrollHeight;
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
        const response = await fetch("http://localhost:3000/api/nutri-chat", {
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

            const md = new markdownit();

            const htmlContent = md.render(data.reply);

            lastBotMsg.innerHTML = htmlContent;

        }else{
            lastBotMsg.textContent = data.reply;
        }

        
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
