import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';

export class Mkdir {
    static exists(...paths: string[]): string {
        const dirname = path.join(...paths);
        // Permisos que quieres asignar (en formato octal)
        // 0o755 significa:
        // Los permisos octales para el directorio(opcional, por defecto 0o777).
        const permisos = 0o777;
        if (!fs.existsSync(dirname)) {
            // Crear la subcarpeta si no existe
            fs.mkdirSync(dirname, { recursive: true, mode: permisos });
        }
        return dirname;
    }
}



/**
 * Busca un archivo o directorio por su nombre de forma ascendente
 * en la jerarquía de directorios, empezando desde un directorio dado.
 *
 * @param name El nombre del archivo o directorio a buscar (ej. 'lemur-mail.config.js').
 * @param cwd El directorio actual desde donde empezar la búsqueda. Por defecto, process.cwd().
 * @returns La ruta absoluta del archivo/directorio encontrado, o `null` si no se encuentra.
 * @throws Si ocurre un error de E/S que no sea 'no existe el archivo/directorio'.
 */
export async function findUp(name: string, cwd: string = process.cwd()): Promise<string | null> {
    let currentDir = path.resolve(cwd); // Aseguramos que la ruta inicial sea absoluta

    // Bucle infinito que se rompe cuando encontramos el archivo o llegamos a la raíz
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const targetPath = path.join(currentDir, name);

        try {
            // Intenta acceder al archivo/directorio. Si no existe, lanza un error.
            await fsPromises.access(targetPath);
            return targetPath; // ¡Encontrado!
        } catch (error: any) {
            // Si el error es que el archivo/directorio no existe (ENOENT), continuamos buscando.
            if (error.code !== 'ENOENT') {
                // Cualquier otro tipo de error (permisos, etc.) lo relanzamos.
                throw error;
            }
        }

        const parentDir = path.dirname(currentDir);

        // Si ya estamos en la raíz del sistema de archivos y no lo encontramos, salimos.
        if (parentDir === currentDir) {
            return null;
        }

        // Sube un nivel en el directorio
        currentDir = parentDir;
    }
}