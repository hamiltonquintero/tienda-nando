# Robot mascota web (HTML/CSS/JavaScript)

## Cómo ejecutar
1. Descomprime la carpeta.
2. Abre `index.html` en un navegador. Para desarrollo, puedes usar la extensión Live Server de VS Code.
3. Los SVG están en `assets/robot/` y se pueden editar con cualquier editor de texto o herramienta vectorial.

## Poses incluidas
`idle`, `saludando`, `pensando`, `feliz`, `triste`, `error`, `trabajando`, `celebrando`, `senalando`, `sorprendido`.

## Integración
- Copia `assets/robot/` a la carpeta pública de tu sitio.
- Copia las reglas relevantes de `styles.css`.
- Usa `robot-[pose].svg` para cambiar la pose.
- El botón flotante y la ventana de chat son una demo visual; el formulario no llama a una IA ni envía mensajes a un servidor. Conecta `script.js` a tu backend/API para respuestas reales.

## Accesibilidad
Los SVG incluyen etiquetas de accesibilidad; el demo incluye `aria-live`, etiquetas de controles y respeta `prefers-reduced-motion`.
