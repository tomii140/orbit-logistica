import supabase from '../config/supabaseClient';

export const soporteService = {
  async crearTicket({ empleadoId, tipo, asunto, mensaje }) {
    const { data, error } = await supabase
      .from('soporte_tickets')
      .insert([{ empleado_id: empleadoId, tipo, asunto, mensaje, estado: 'Pendiente' }])
      .select();
    if (error) throw error;
    return data;
  },

  async obtenerMisTickets(empleadoId) {
    const { data, error } = await supabase
      .from('soporte_tickets')
      .select('*')
      .eq('empleado_id', empleadoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async obtenerTodosLosTickets() {
    const { data, error } = await supabase
      .from('soporte_tickets')
      .select(`*, empleados (nombre, apellido, email)`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async responderTicket(ticketId, estado, respuestaAdmin) {
    const { data, error } = await supabase
      .from('soporte_tickets')
      .update({ estado, respuesta_admin: respuestaAdmin })
      .eq('id', ticketId)
      .select();
    if (error) throw error;
    return data;
  }
};

export default soporteService;