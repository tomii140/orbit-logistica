/**
 * Genera un enlace de WhatsApp y abre la aplicación o WhatsApp Web.
 * @param {string} numeroTelefono - Número con código de país (ej: '5492611234567').
 * @param {string} mensaje - Texto del mensaje.
 */
export const enviarPorWhatsApp = (numeroTelefono = '', mensaje = '') => {
  const numLimpio = numeroTelefono.replace(/\D/g, '');
  const textoCodificado = encodeURIComponent(mensaje);
  
  const url = numLimpio 
    ? `https://wa.me/${numLimpio}?text=${textoCodificado}`
    : `https://wa.me/?text=${textoCodificado}`;

  // Detección simple de dispositivo móvil
  const esMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (esMobile) {
    // En móviles, redirige directamente a la app de WhatsApp instalada
    window.location.href = url;
  } else {
    // En escritorio, abre WhatsApp Web en una pestaña nueva
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Formatea y envía la planificación de tareas o registros por WhatsApp.
 * @param {string} numero - Número de destino.
 * @param {Array} tareas - Lista de tareas o registros.
 */
export const enviarPlanificacionWhatsApp = (numero = '', tareas = []) => {
  if (!tareas.length) return;

  const encabezado = `📋 *ORBIT Logística - Planificación del Día*\n\n`;
  const detalle = tareas.map((t, idx) => 
    `*${idx + 1}. ${t.asunto || t.observaciones || t.tarea_principal_manana || 'Tarea'}*\n` +
    `   • Estado: ${t.estado || 'Pendiente'}\n` +
    `   • Asignado: ${t.empleado_nombre || t.creado_por || 'Sin asignar'}\n`
  ).join('\n');

  const mensajeFinal = `${encabezado}${detalle}\n_Enviado automáticamente desde ORBIT Logística_`;
  enviarPorWhatsApp(numero, mensajeFinal);
};