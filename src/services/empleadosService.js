import { supabase } from '../config/supabaseClient';

export const empleadosService = {
  // Obtener todos los empleados
  async obtenerEmpleados() {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Pre-registrar o actualizar el rol de un usuario
  async guardarEmpleado(empleado) {
    const { data, error } = await supabase
      .from('empleados')
      .upsert(empleado)
      .select();

    if (error) throw error;
    return data;
  }
};