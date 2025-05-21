import path from 'path';
import fs from 'fs/promises'; // Para leer archivos de forma asíncrona
import mustache from 'mustache'; // Importa el motor de plantillas Mustache

// Interface para el contenido renderizado que devolverá RenderManager.render
export interface RenderedContent {
    html: string;
    text?: string; // Opcional: si también generas una versión de texto plano
}

export class RenderManager {
    /**
     * Renderiza una plantilla utilizando Mustache.
     * @param templatesBasePath La ruta base donde se encuentran todas las plantillas (ej. './src/templates').
     * @param templateName El nombre del archivo de la plantilla (sin extensión, ej. 'verification').
     * @param data Los datos a inyectar en la plantilla.
     * @returns Un objeto que contiene el contenido HTML renderizado.
     * @throws Si la plantilla no se encuentra o hay un error al leerla/renderizarla.
     */
    public static async render<T>(
        templatesBasePath: string,
        templateName: string,
        data: T, // Usamos Record<string, any> para los datos de la plantilla
        regex?: RegExp
    ): Promise<RenderedContent> {
        // Construye la ruta completa del archivo de plantilla.
        // Asumimos que las plantillas son archivos .mustache.
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

            let matchs: RegExpMatchArray | null = null;
            if (regex && Array.isArray(matchs = templateContent.match(regex)) && matchs.length > 0) {
                const [_, content] = matchs;
                templateContent = content.trim();
            }

            // Renderiza la plantilla con los datos proporcionados.
            const renderedHtml = mustache.render(templateContent, data);

            // Opcional: Si quieres generar una versión de texto plano del HTML,
            // necesitarías una librería adicional como 'html-to-text' o similar.
            // Por simplicidad, aquí solo devolvemos el HTML.
            // Si tu plantilla Mustache también tiene una versión de texto, podrías leerla
            // de un archivo .txt separado y renderizarla también.

            return { html: renderedHtml };

        } catch (error: any) {
            throw new Error(`Error al renderizar la plantilla "${templateName}": ${error.message}`);
        }
    }
}