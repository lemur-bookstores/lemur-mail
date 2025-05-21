import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

export class Mkdir {
    /**
     * Asegura que una ruta de directorio exista. Si el directorio no existe, lo crea recursivamente.
     * Los permisos del directorio se establecen en 0o777 (lectura, escritura y ejecución para todos).
     *
     * @param {...string[]} paths - Componentes de la ruta del directorio a crear.
     * @returns {string} La ruta absoluta del directorio creado o existente.
     */
    static exists(...paths: string[]): string {
        const dirname = path.join(...paths);
        const permisos = 0o777; // Permisos: lectura, escritura y ejecución para propietario, grupo y otros.

        if (!fs.existsSync(dirname)) {
            // Crea el directorio (y sus padres si es necesario) si no existe.
            fs.mkdirSync(dirname, { recursive: true, mode: permisos });
        }
        return dirname;
    }
}

/**
 * Busca un archivo o directorio específico (`name`) de forma ascendente
 * en la jerarquía de directorios, comenzando desde un directorio dado (`cwd`).
 *
 * @param {string} name - El nombre del archivo o directorio a buscar (ej., 'lemur-mail.config.js').
 * @param {string} [cwd=process.cwd()] - El directorio actual desde donde empezar la búsqueda.
 * Por defecto, usa el directorio de trabajo actual del proceso.
 * @returns {Promise<string | null>} Una promesa que se resuelve con la ruta absoluta del
 * archivo/directorio encontrado, o `null` si no se encuentra.
 * @throws {Error} Si ocurre un error de E/S que no sea 'ENOENT' (archivo/directorio no encontrado),
 * como problemas de permisos.
 */
export async function findUp(name: string, cwd: string = process.cwd()): Promise<string | null> {
    // Asegura que la ruta inicial sea absoluta para una búsqueda consistente.
    let currentDir = path.resolve(cwd);

    // Bucle para subir en la jerarquía de directorios.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const targetPath = path.join(currentDir, name);

        try {
            // Intenta acceder al archivo/directorio. Si tiene éxito, significa que existe.
            await fsPromises.access(targetPath);
            return targetPath; // ¡Encontrado!
        } catch (error: any) {
            // Si el error es 'ENOENT' (no existe el archivo/directorio), sube un nivel y continúa buscando.
            if (error.code !== 'ENOENT') {
                // Cualquier otro tipo de error (ej., permisos denegados) se relanza.
                throw error;
            }
        }

        // Calcula el directorio padre.
        const parentDir = path.dirname(currentDir);

        // Si el directorio padre es el mismo que el actual, hemos llegado a la raíz del sistema de archivos
        // y no se encontró el objetivo.
        if (parentDir === currentDir) {
            return null;
        }

        // Sube un nivel en la jerarquía de directorios para la próxima iteración.
        currentDir = parentDir;
    }
}