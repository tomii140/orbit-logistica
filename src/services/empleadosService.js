import { supabase } from '../config/supabaseClient';

export const empleadosService = {
  // Obtener empleados
  async obtenerEmpleados() {
    const { data, error } = await supabase
      .from('empleados')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Guardar o actualizar registro
  async guardarEmpleado(empleado) {
    const { data, error } = await supabase
      .from('empleados')
      .upsert(empleado)
      .select();

    if (error) throw error;
    return data;
  },

  // Eliminar empleado de forma segura
  async eliminarEmpleado(idEmpleadoTarget) {
    const { data, error } = await supabase
      .from('empleados')
      .delete()
      .eq('id', idEmpleadoTarget);

    if (error) {
      // Mensaje claro si la política RLS del backend bloquea la acción
      if (error.code === '42501') {
        throw new Error('No tienes permisos suficientes para eliminar este registro.');
      }
      throw error;
    }
    return data;
  }
};