/**
 * Convierte el diagnóstico en formato Markdown a HTML con estilos
 */
export function convertDiagnosisToHTML(markdown: string): string {
  let html = markdown;

  // Eliminar el separador de inicio y fin (---)
  html = html.replace(/^---\s*\n/gm, '').replace(/\n\s*---$/gm, '');

  // Convertir encabezados H3 (### Título)
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-2xl font-bold text-brand-green-700 dark:text-brand-green-400 mb-6 mt-8 pt-4">$1</h3>');

  // Convertir encabezados H4 (#### Título)
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4 mt-6">$1</h4>');  // Convertir texto en negrita (**texto**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-neutral-900 dark:text-white">$1</strong>');

  // Convertir checkmarks (✅)
  html = html.replace(/^✅ (.+)$/gm, '<div class="flex items-start gap-3 mb-3 pl-2"><span class="text-brand-green-500 text-xl flex-shrink-0 mt-0.5">✅</span><span class="text-neutral-700 dark:text-neutral-300 leading-relaxed">$1</span></div>');

  // Convertir listas con guiones (- item)
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';

    if (line.match(/^- (.+)$/)) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside space-y-2 mb-5 ml-6">');
        inList = true;
      }
      const content = line.replace(/^- /, '');
      processedLines.push(`<li class="text-neutral-700 dark:text-neutral-300 leading-relaxed pl-2">${content}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }

  if (inList) {
    processedLines.push('</ul>');
  }

  html = processedLines.join('\n');

  // Convertir texto en cursiva (*texto*)
  html = html.replace(/\*([^*\n]+)\*/g, '<em class="italic text-neutral-600 dark:text-neutral-400">$1</em>');

  // Convertir párrafos (líneas no vacías que no son etiquetas HTML)
  html = html.split('\n').map(line => {
    const trimmed = line.trim();

    // Si es vacío, mantener el salto
    if (!trimmed) return '';

    // Si ya es HTML, dejarlo como está
    if (trimmed.startsWith('<')) return line;

    // Si es un título, dejarlo como está
    if (trimmed.startsWith('#')) return line;

    // Convertir a párrafo
    return `<p class="mb-4 text-neutral-700 dark:text-neutral-300 leading-relaxed text-[15px]">${trimmed}</p>`;
  }).join('\n');

  // Agregar contenedor especial para el título principal
  html = html.replace(
    /<h3 class="text-2xl font-bold text-brand-green-700 dark:text-brand-green-400 mb-6 mt-8 pt-4">🔬 DIAGNÓSTICO INTEGRAL<\/h3>/,
    '<div class="bg-gradient-to-r from-brand-green-50 to-green-100 dark:from-neutral-800 dark:to-neutral-700 rounded-2xl p-6 mb-8 shadow-lg border border-brand-green-200 dark:border-neutral-600"><h3 class="text-2xl font-bold text-brand-green-700 dark:text-brand-green-400 mb-0">🔬 DIAGNÓSTICO INTEGRAL</h3></div>'
  );

  // Agregar link al programa
  html = html.replace(
    /Método Objetivo Vientre Plano|MÉTODO OVP|Método OVP/gi,
    '<a href="https://objetivovientreplano.com/suscripcion/" target="_blank" rel="noopener noreferrer" class="text-brand-green-600 dark:text-brand-green-400 font-semibold hover:underline">Método Objetivo Vientre Plano</a>'
  );

  // Limpiar líneas vacías múltiples
  html = html.replace(/\n{3,}/g, '\n\n');

  // Limpiar espacios en blanco al inicio y final
  html = html.trim();

  return html;
}
