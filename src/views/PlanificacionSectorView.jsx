import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient';
import { enviarPlanificacionWhatsApp } from '../utils/whatsappHelper';

export function PlanificacionSectorView({ tituloSector, colorBadge, usuarioActual, styles }) {
  const userRol = usuarioActual?.rol?.toLowerCase() || '';
  const esAdmin = userRol === 'admin';
  const esGestionador = esAdmin || userRol === 'supervisor';

  const sectorNombre = tituloSector.includes('SALÓN') ? 'Salón' 
    : tituloSector.includes('CARNE') ? 'Carnicería' : 'Panadería';

  const [listaEmpleados, setListaEmpleados] = useState([]);
  const [registrosCamion, setRegistrosCamion] = useState([]);
  const [cuadrantePersonal, setCuadrantePersonal] = useState([]);
  const [editandoFilaId, setEditandoFilaId] = useState(null);

  const [camionForm, setCamionForm] = useState({ 
    fecha: new Date().toISOString().split('T')[0], 
    bultos: '', 
    horaLlegada: '', 
    inicioReposicion: '', 
    repositores: 4 
  });

  const registrarAuditoria = async (accion, detalles) => {
    if (!esAdmin) return;
    try {
      await supabase.from('admin_auditoria').insert([{
        admin_email: usuarioActual.email,
        accion,
        detalles
      }]);
    } catch (err) {
      console.error('Error registrando auditoría:', err);
    }
  };

  const cargarListaEmpleados = useCallback(async () => {
    const { data, error } = await supabase.from('empleados').select('id, nombre, apellido').eq('activo', true);
    if (!error && data) setListaEmpleados(data);
  }, []);

  const cargarCamiones = useCallback(async () => {
    const { data, error } = await supabase.from('registros').select('*').order('created_at', { ascending: false });
    if (!error && data) setRegistrosCamion(data);
  }, []);

  const cargarCuadrante = useCallback(async () => {
    const { data, error } = await supabase.from('planificacion_cuadrante').select('*').eq('sector', sectorNombre).order('id');
    if (!error && data) setCuadrantePersonal(data);
  }, [sectorNombre]);

  useEffect(() => {
    cargarListaEmpleados();
    cargarCamiones();
    cargarCuadrante();
  }, [cargarListaEmpleados, cargarCamiones, cargarCuadrante]);

  const agregarCamion = async (e) => {
    e.preventDefault();
    const cantBultos = parseInt(camionForm.bultos, 10);
    if (isNaN(cantBultos) || cantBultos <= 0) return alert('Ingresá una cantidad válida de bultos');

    const payload = {
      fecha: camionForm.fecha,
      bultos: cantBultos,
      hora_llegada: camionForm.horaLlegada || null,
      inicio_reposicion: camionForm.inicioReposicion || null,
      repositores: parseInt(camionForm.repositores, 10) || 0,
      creado_por: usuarioActual.email
    };

    const { error } = await supabase.from('registros').insert([payload]);
    if (!error) {
      if (esAdmin) {
        await registrarAuditoria('ALTA CAMIÓN', `Registro de camión en sector ${sectorNombre} - Fecha: ${camionForm.fecha}`);
      }
      cargarCamiones();
      setCamionForm({ fecha: new Date().toISOString().split('T')[0], bultos: '', horaLlegada: '', inicioReposicion: '', repositores: 4 });
    } else {
      alert(`Error al guardar camión: ${error.message}`);
    }
  };

  const borrarCamion = async (id) => {
    const msj = esAdmin 
      ? '⚠️ ADVERTENCIA DE ADMINISTRADOR\n\n¿Estás seguro de que deseas eliminar este registro de camión?\nEsta acción quedará guardada en el historial de auditoría.'
      : '¿Eliminar este registro de camión?';

    if (!window.confirm(msj)) return;

    const { error } = await supabase.from('registros').delete().eq('id', id);
    if (!error) {
      if (esAdmin) {
        await registrarAuditoria('ELIMINACIÓN CAMIÓN', `Se eliminó el registro de camión ID: ${id} en ${sectorNombre}`);
      }
      cargarCamiones();
    } else {
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  const agregarFilaCuadrante = async () => {
    const nombreInicial = listaEmpleados[0] ? `${listaEmpleados[0].nombre} ${listaEmpleados[0].apellido}` : 'EMPLEADO NUEVO';
    const nuevaFila = {
      empleado_nombre: nombreInicial,
      sector: sectorNombre,
      tarea_principal_manana: 'Cajas / Atención',
      ingreso_manana: '08:00',
      salida_manana: '12:00'
    };

    const { data, error } = await supabase.from('planificacion_cuadrante').insert([nuevaFila]).select();
    if (!error && data) {
      if (esAdmin) {
        await registrarAuditoria('ASIGNACIÓN PERSONAL', `Nueva fila de cuadrante creada para ${nombreInicial} en ${sectorNombre}`);
      }
      setCuadrantePersonal(prev => [...prev, data[0]]);
      setEditandoFilaId(data[0].id);
    } else if (error) {
      alert(`Error al agregar fila: ${error.message}`);
    }
  };

  const actualizarCeldaCuadrante = async (id, campo, valor) => {
    setCuadrantePersonal(prev => prev.map(item => item.id === id ? { ...item, [campo]: valor } : item));
    
    const { error } = await supabase.from('planificacion_cuadrante').update({ [campo]: valor }).eq('id', id);
    
    if (error) {
      alert(`Error al actualizar el campo ${campo}: ${error.message}`);
      cargarCuadrante(); // Revertir estado local en caso de error de persistencia
      return;
    }

    if (esAdmin) {
      await registrarAuditoria('MODIFICACIÓN CUADRANTE', `Cambio en ID ${id} [${campo} -> ${valor}] en sector ${sectorNombre}`);
    }
  };

  const borrarFilaCuadrante = async (id) => {
    const msj = esAdmin
      ? '⚠️ ADVERTENCIA DE ADMINISTRADOR\n\n¿Estás seguro de que deseas eliminar esta asignación del cuadrante?\nLa acción quedará registrada.'
      : '¿Eliminar esta asignación?';

    if (!window.confirm(msj)) return;

    const { error } = await supabase.from('planificacion_cuadrante').delete().eq('id', id);
    if (!error) {
      if (esAdmin) {
        await registrarAuditoria('ELIMINACIÓN CUADRANTE', `Se eliminó la fila ID: ${id} del cuadrante en ${sectorNombre}`);
      }
      setCuadrantePersonal(prev => prev.filter(x => x.id !== id));
    } else {
      alert(`Error al eliminar fila: ${error.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.headerSector}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: colorBadge }}>{tituloSector}</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sector: {sectorNombre} | Sucursal: Perú</span>
        </div>
        <span style={styles.badgeActive}>SINCRO EN TIEMPO REAL</span>
      </div>

      {!esGestionador && (
        <div style={{ backgroundColor: '#0284c71a', border: '1px solid #0284c7', color: '#38bdf8', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
          ℹ️ <b>Modo Consulta:</b> Estás viendo la distribución de turnos y tareas asignadas. Solo lectura.
        </div>
      )}

      {/* BLOQUE 1: RECEPCIÓN DE CAMIÓN */}
      <div style={styles.cardSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#facc15', fontSize: '15px' }}>🚛 Control de Camiones</h3>
          <button 
            onClick={() => enviarPlanificacionWhatsApp('', registrosCamion)}
            style={{ background: '#25D366', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
          >
            📲 Compartir Planificación por WhatsApp
          </button>
        </div>
        
        {esGestionador && (
          <form onSubmit={agregarCamion} style={styles.formGrid}>
            <input type="date" value={camionForm.fecha} onChange={e => setCamionForm(prev => ({...prev, fecha: e.target.value}))} style={styles.inputTable} />
            <input type="number" placeholder="Cant. Bultos" value={camionForm.bultos} onChange={e => setCamionForm(prev => ({...prev, bultos: e.target.value}))} style={styles.inputTable} />
            <input type="time" title="Hora Llegada" value={camionForm.horaLlegada} onChange={e => setCamionForm(prev => ({...prev, horaLlegada: e.target.value}))} style={styles.inputTable} />
            <input type="time" title="Inicio Reposición" value={camionForm.inicioReposicion} onChange={e => setCamionForm(prev => ({...prev, inicioReposicion: e.target.value}))} style={styles.inputTable} />
            <input type="number" placeholder="Repositores" value={camionForm.repositores} onChange={e => setCamionForm(prev => ({...prev, repositores: e.target.value}))} style={styles.inputTable} />
            <button type="submit" style={styles.btnSuccess}>+ Registrar Camión</button>
          </form>
        )}

        <table style={{ ...styles.table, textAlign: 'center' }}>
          <thead>
            <tr style={styles.thRowYellow}>
              <th style={styles.td}>FECHA</th>
              <th style={styles.td}>BULTOS</th>
              <th style={styles.td}>LLEGADA</th>
              <th style={styles.td}>INICIO REP.</th>
              <th style={styles.td}>PERSONAL</th>
              {esGestionador && <th style={styles.td}>ACCIONES</th>}
            </tr>
          </thead>
          <tbody>
            {registrosCamion.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={styles.td}>{r.fecha}</td>
                <td style={{ ...styles.td, fontWeight: 'bold', color: '#38bdf8' }}>{r.bultos} bts</td>
                <td style={styles.td}>{r.hora_llegada || '--:--'}</td>
                <td style={styles.td}>{r.inicio_reposicion || '--:--'}</td>
                <td style={styles.td}>{r.repositores} emp.</td>
                {esGestionador && (
                  <td style={styles.td}>
                    <button onClick={() => borrarCamion(r.id)} style={{ ...styles.btnDanger, padding: '4px 8px', fontSize: '11px', width: 'auto' }}>🗑️</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BLOQUE 2: CUADRANTE DE EMPLEADOS */}
      <div style={styles.cardSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '15px' }}>👥 Cuadrante e Intención de Horarios</h3>
          {esGestionador && (
            <button onClick={agregarFilaCuadrante} style={styles.btnPrimary}>
              + Asignar Personal
            </button>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ ...styles.table, fontSize: '11px' }}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.td}>EMPLEADO</th>
                <th style={styles.td}>TURNO MAÑANA</th>
                <th style={styles.td}>DESAYUNO</th>
                <th style={styles.td}>TAREA PRINCIPAL</th>
                <th style={styles.td}>TURNO TARDE</th>
                <th style={styles.td}>MERIENDA</th>
                <th style={styles.td}>TAREA TARDE</th>
                {esGestionador && <th style={styles.td}>ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {cuadrantePersonal.map(c => {
                const esEdit = esGestionador && editandoFilaId === c.id;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #334155', backgroundColor: esEdit ? '#1e293b' : 'transparent' }}>
                    <td style={styles.td}>
                      {esEdit ? (
                        <select 
                          value={c.empleado_nombre} 
                          onChange={e => actualizarCeldaCuadrante(c.id, 'empleado_nombre', e.target.value)}
                          style={styles.selectSmall}
                        >
                          {listaEmpleados.map(emp => (
                            <option key={emp.id} value={`${emp.nombre} ${emp.apellido}`}>
                              {emp.nombre} {emp.apellido}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <b>👤 {c.empleado_nombre}</b>
                      )}
                    </td>

                    <td style={styles.td}>
                      {esEdit ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <input type="time" value={c.ingreso_manana || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'ingreso_manana', e.target.value)} style={styles.inputInline} />
                          <input type="time" value={c.salida_manana || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'salida_manana', e.target.value)} style={styles.inputInline} />
                        </div>
                      ) : (
                        <span style={{ color: '#4ade80' }}>{c.ingreso_manana || '--:--'} a {c.salida_manana || '--:--'}</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {esEdit ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <input type="time" value={c.hs_desayuno_inicio || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'hs_desayuno_inicio', e.target.value)} style={styles.inputInline} />
                          <input type="time" value={c.hs_desayuno_fin || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'hs_desayuno_fin', e.target.value)} style={styles.inputInline} />
                        </div>
                      ) : (
                        <span style={{ color: '#fbbf24' }}>{c.hs_desayuno_inicio ? `${c.hs_desayuno_inicio} - ${c.hs_desayuno_fin}` : '-'}</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {esEdit ? (
                        <select value={c.tarea_principal_manana || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'tarea_principal_manana', e.target.value)} style={styles.selectSmall}>
                          <option value="Cajas / Atención">Cajas / Atención</option>
                          <option value="Reposición Línea">Reposición Línea</option>
                          <option value="Corte / Preparación">Corte / Preparación</option>
                          <option value="Horno / Producción">Horno / Producción</option>
                          <option value="Control Recepción">Control Recepción</option>
                        </select>
                      ) : (
                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{c.tarea_principal_manana || '-'}</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {esEdit ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <input type="time" value={c.ingreso_tarde || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'ingreso_tarde', e.target.value)} style={styles.inputInline} />
                          <input type="time" value={c.salida_tarde || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'salida_tarde', e.target.value)} style={styles.inputInline} />
                        </div>
                      ) : (
                        <span style={{ color: '#4ade80' }}>{c.ingreso_tarde ? `${c.ingreso_tarde} a ${c.salida_tarde}` : 'Franco / Off'}</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {esEdit ? (
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <input type="time" value={c.hs_merienda_inicio || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'hs_merienda_inicio', e.target.value)} style={styles.inputInline} />
                          <input type="time" value={c.hs_merienda_fin || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'hs_merienda_fin', e.target.value)} style={styles.inputInline} />
                        </div>
                      ) : (
                        <span style={{ color: '#fbbf24' }}>{c.hs_merienda_inicio ? `${c.hs_merienda_inicio} - ${c.hs_merienda_fin}` : '-'}</span>
                      )}
                    </td>

                    <td style={styles.td}>
                      {esEdit ? (
                        <select value={c.tarea_principal_tarde || ''} onChange={e => actualizarCeldaCuadrante(c.id, 'tarea_principal_tarde', e.target.value)} style={styles.selectSmall}>
                          <option value="-">- Sin Asignar -</option>
                          <option value="Cierres / Cajas">Cierres / Cajas</option>
                          <option value="Limpieza y Frenteo">Limpieza y Frenteo</option>
                          <option value="Asistencia Mostrador">Asistencia Mostrador</option>
                        </select>
                      ) : (
                        <span style={{ color: '#e879f9', fontWeight: 'bold' }}>{c.tarea_principal_tarde || '-'}</span>
                      )}
                    </td>

                    {esGestionador && (
                      <td style={{ ...styles.td, display: 'flex', gap: '4px' }}>
                        <button 
                          onClick={() => setEditandoFilaId(esEdit ? null : c.id)} 
                          style={{ ...styles.btnPrimary, backgroundColor: esEdit ? '#059669' : '#d97706', padding: '4px 6px', fontSize: '10px' }}
                        >
                          {esEdit ? '💾 Listo' : '✏️ Editar'}
                        </button>
                        <button 
                          onClick={() => borrarFilaCuadrante(c.id)} 
                          style={{ ...styles.btnDanger, padding: '4px 6px', fontSize: '10px', width: 'auto' }}
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PlanificacionSectorView;