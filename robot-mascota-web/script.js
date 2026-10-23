const poseText = {
  idle: "Estoy listo para ayudarte.",
  saludando: "¡Hola! ¿En qué te puedo ayudar?",
  pensando: "Dame un momento, estoy pensando…",
  feliz: "¡Qué bueno verte por aquí!",
  triste: "Vaya, parece que algo no salió bien.",
  error: "Ups, ocurrió un error. Inténtalo de nuevo.",
  trabajando: "Estoy trabajando en tu solicitud…",
  celebrando: "¡Excelente! ¡Lo lograste!",
  senalando: "Mira aquí para continuar.",
  sorprendido: "¡Wow! ¡Qué sorpresa!"
};
const robotDemo = document.querySelector("#robot-demo");
const caption = document.querySelector("#robot-caption");
const chatRobot = document.querySelector("#chat-robot");
function setRobotPose(pose) {
  const src = `assets/robot/robot-${pose}.svg`;
  robotDemo.src = src;
  robotDemo.alt = `Robot mascota: ${pose}`;
  caption.textContent = poseText[pose] || poseText.idle;
  chatRobot.src = `assets/robot/robot-${pose === "error" ? "error" : pose === "trabajando" ? "pensando" : "feliz"}.svg`;
}
document.querySelectorAll("[data-pose]").forEach(button => {
  button.addEventListener("click", () => setRobotPose(button.dataset.pose));
});
const launcher = document.querySelector("#robot-launcher");
const chat = document.querySelector("#robot-chat");
function toggleChat(open) {
  chat.hidden = !open;
  launcher.setAttribute("aria-expanded", String(open));
}
launcher.addEventListener("click", () => toggleChat(chat.hidden));
document.querySelector("#robot-close").addEventListener("click", () => toggleChat(false));
document.querySelector("#robot-form").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#robot-input");
  const note = document.querySelector("#chat-note");
  if (!input.value.trim()) { note.textContent = "Escribe un mensaje primero."; return; }
  note.textContent = "Mensaje de demostración. Conecta este formulario a tu backend o API para obtener respuestas reales.";
  input.value = "";
  setRobotPose("pensando");
});
