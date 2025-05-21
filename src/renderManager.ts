import path from 'path';
import fs from 'fs/promises'; // Para leer archivos de forma asíncrona
import mustache from 'mustache'; // Importa el motor de plantillas Mustache

/**
 * Define la estructura del contenido renderizado que devolverá `RenderManager.render`.
 */
export interface RenderedContent {
    /**
     * El contenido HTML renderizado de la plantilla.
     * @type {string}
     */
    html: string;
    /**
     * El contenido opcional de texto plano de la plantilla, si se genera.
     * @type {string}
     * @optional
     */
    text?: string;
}

/**
 * Gestiona la renderización de plantillas de correo electrónico utilizando el motor Mustache.
 * Esta clase es una utilidad estática para procesar archivos de plantilla y convertirlos en HTML.
 */
export class RenderManager {
    /**
     * Renderiza una plantilla Mustache con los datos proporcionados.
     * Si se provee una expresión regular, intentará extraer contenido específico de la plantilla
     * antes de la renderización (ej., el cuerpo de un HTML).
     *
     * @template T - El tipo de los datos que se inyectarán en la plantilla.
     * @param {string} templatesBasePath - La ruta base donde se encuentran todas las plantillas (ej., `./src/templates`).
     * @param {string} templateName - El nombre del archivo de la plantilla (sin extensión, ej., 'verificacion').
     * @param {T} data - Los datos que se usarán para rellenar los marcadores de posición en la plantilla.
     * @param {RegExp} [regex] - Una expresión regular opcional (ej., `/<body[^>]*>([\s\S]*?)<\/body>/`)
     * para pre-procesar el contenido de la plantilla antes de la renderización con Mustache.
     * @returns {Promise<RenderedContent>} Un objeto que contiene el contenido HTML renderizado.
     * @throws {Error} Si la plantilla no se encuentra, hay un error al leerla o al renderizarla.
     */
    public static async render<T>(
        templatesBasePath: string,
        templateName: string,
        data: T,
        regex?: RegExp
    ): Promise<RenderedContent> {
        // Construye la ruta completa al archivo de plantilla, asumiendo una extensión .mustache.
        const templateFilePath = path.join(templatesBasePath, `${templateName}.mustache`);

        let templateContent: string;
        try {
            // Lee el contenido de la plantilla de forma asíncrona.
            templateContent = await fs.readFile(templateFilePath, 'utf-8');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new Error(`Plantilla no encontrada: "${templateName}" en "${templateFilePath}".`);
            }
            throw new Error(`Error al leer la plantilla "${templateName}": ${error.message}`);
        }

        try {
            // Si se proporciona una expresión regular, intenta extraer una parte del contenido.
            let matchs: RegExpMatchArray | null = null;
            if (regex && (matchs = templateContent.match(regex)) && matchs.length > 0) {
                const [_, content] = matchs;
                templateContent = content.trim(); // Usa la primera captura y elimina espacios en blanco.
            }

            // Renderiza la plantilla con los datos usando Mustache.
            const renderedHtml = mustache.render(templateContent, data);

            // TODO: Añadir lógica para generar una versión de texto plano si es necesario,
            // quizás leyendo un archivo .txt correspondiente o usando una librería como 'html-to-text'.
            return { html: renderedHtml };

        } catch (error: any) {
            throw new Error(`Error al renderizar la plantilla "${templateName}": ${error.message}`);
        }
    }
}