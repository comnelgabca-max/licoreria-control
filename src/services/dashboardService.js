import { supabase } from './supabase';

/**
 * Servicio para obtener estadísticas del Dashboard
 */

// =====================================================
// ESTADÍSTICAS GENERALES
// =====================================================

/**
 * Obtener todas las estadísticas del dashboard usando la función de Supabase
 * @returns {Promise<Object>} Estadísticas generales
 */
export const getDashboardStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);

    // Fallback: calcular manualmente si la función RPC falla
    return await getDashboardStatsManual();
  }
};

/**
 * Calcular estadísticas manualmente (fallback)
 * @returns {Promise<Object>} Estadísticas
 */
const getDashboardStatsManual = async () => {
  try {
    // Obtener datos de clientes
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .select('saldo_total, is_active');

    if (clientesError) throw clientesError;

    const clientesActivos = clientesData.filter(c => c.is_active);
    const totalClientes = clientesActivos.length;
    const clientesConDeuda = clientesActivos.filter(c => c.saldo_total > 0).length;
    const totalDeudas = clientesActivos.reduce((sum, c) => sum + parseFloat(c.saldo_total || 0), 0);

    // Obtener transacciones de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const { data: transaccionesHoy, error: transaccionesError } = await supabase
      .from('transacciones')
      .select('tipo, monto')
      .gte('fecha', hoy.toISOString());

    if (transaccionesError) throw transaccionesError;

    const pagosHoy = transaccionesHoy
      .filter(t => t.tipo === 'pago')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);

    const ventasHoy = transaccionesHoy
      .filter(t => t.tipo === 'venta')
      .reduce((sum, t) => sum + parseFloat(t.monto || 0), 0);

    const stats = {
      total_clientes: totalClientes,
      clientes_con_deuda: clientesConDeuda,
      total_deudas: totalDeudas,
      pagos_hoy: pagosHoy,
      ventas_hoy: ventasHoy
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error al calcular estadísticas manualmente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// TOP DEUDORES
// =====================================================

/**
 * Obtener los clientes con mayor deuda
 * @param {number} limit - Cantidad de resultados
 * @returns {Promise<Array>} Top deudores
 */
export const getTopDeudores = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .rpc('get_top_deudores', { limit_count: limit });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener top deudores:', error);

    // Fallback manual
    return await getTopDeudoresManual(limit);
  }
};

/**
 * Obtener top deudores manualmente (fallback)
 * @param {number} limit - Cantidad de resultados
 * @returns {Promise<Array>} Top deudores
 */
const getTopDeudoresManual = async (limit = 5) => {
  try {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombre, telefono, saldo_total, ultima_compra')
      .gt('saldo_total', 0)
      .eq('is_active', true)
      .order('saldo_total', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Formatear para que coincida con el formato de la función RPC
    const formattedData = data.map(c => ({
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefono,
      deuda: parseFloat(c.saldo_total),
      ultima_compra: c.ultima_compra
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Error al obtener top deudores manualmente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ACTIVIDAD RECIENTE
// =====================================================

/**
 * Obtener las últimas transacciones
 * @param {number} limit - Cantidad de transacciones
 * @returns {Promise<Array>} Transacciones recientes
 */
export const getActividadReciente = async (limit = 6) => {
  try {
    const { data, error } = await supabase
      .from('transacciones')
      .select(`
        id,
        tipo,
        monto,
        descripcion,
        fecha,
        cliente:clientes(nombre)
      `)
      .order('fecha', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Formatear datos
    const formattedData = data.map(t => ({
      id: t.id,
      tipo: t.tipo,
      cliente: t.cliente?.nombre || 'Cliente desconocido',
      monto: parseFloat(t.monto),
      descripcion: t.descripcion,
      fecha: t.fecha
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Error al obtener actividad reciente:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// TENDENCIAS Y ANÁLISIS
// =====================================================

/**
 * Obtener tendencias de ventas y pagos por día (últimos 7 días)
 * @returns {Promise<Object>} Datos para gráfica
 */
export const getTendenciasSemanal = async () => {
  try {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    const { data, error } = await supabase
      .from('transacciones')
      .select('tipo, monto, fecha')
      .gte('fecha', hace7Dias.toISOString())
      .order('fecha', { ascending: true });

    if (error) throw error;

    // Agrupar por día
    const groupedByDay = {};

    data.forEach(t => {
      const fecha = new Date(t.fecha).toLocaleDateString('es-DO');

      if (!groupedByDay[fecha]) {
        groupedByDay[fecha] = { fecha, ventas: 0, pagos: 0 };
      }

      if (t.tipo === 'venta') {
        groupedByDay[fecha].ventas += parseFloat(t.monto);
      } else {
        groupedByDay[fecha].pagos += parseFloat(t.monto);
      }
    });

    const chartData = Object.values(groupedByDay);

    return { success: true, data: chartData };
  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener comparación del mes actual vs mes anterior
 * @returns {Promise<Object>} Comparación de métricas
 */
export const getComparacionMensual = async () => {
  try {
    const ahora = new Date();
    const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    const finMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth(), 0);

    // Mes actual
    const { data: mesActual, error: errorActual } = await supabase
      .from('transacciones')
      .select('tipo, monto')
      .gte('fecha', inicioMesActual.toISOString());

    if (errorActual) throw errorActual;

    // Mes anterior
    const { data: mesAnterior, error: errorAnterior } = await supabase
      .from('transacciones')
      .select('tipo, monto')
      .gte('fecha', inicioMesAnterior.toISOString())
      .lte('fecha', finMesAnterior.toISOString());

    if (errorAnterior) throw errorAnterior;

    const ventasActual = mesActual
      .filter(t => t.tipo === 'venta')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const pagosActual = mesActual
      .filter(t => t.tipo === 'pago')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const ventasAnterior = mesAnterior
      .filter(t => t.tipo === 'venta')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const pagosAnterior = mesAnterior
      .filter(t => t.tipo === 'pago')
      .reduce((sum, t) => sum + parseFloat(t.monto), 0);

    const comparacion = {
      mesActual: {
        ventas: ventasActual,
        pagos: pagosActual,
        neto: ventasActual - pagosActual
      },
      mesAnterior: {
        ventas: ventasAnterior,
        pagos: pagosAnterior,
        neto: ventasAnterior - pagosAnterior
      },
      cambio: {
        ventas: ventasAnterior > 0 ? ((ventasActual - ventasAnterior) / ventasAnterior) * 100 : 0,
        pagos: pagosAnterior > 0 ? ((pagosActual - pagosAnterior) / pagosAnterior) * 100 : 0
      }
    };

    return { success: true, data: comparacion };
  } catch (error) {
    console.error('Error al obtener comparación mensual:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// ALERTAS Y NOTIFICACIONES
// =====================================================

/**
 * Obtener alertas importantes (deudas altas, sin actividad reciente, etc.)
 * @returns {Promise<Array>} Lista de alertas
 */
export const getAlertas = async () => {
  try {
    const alertas = [];

    // 1. Clientes con deudas muy altas (>$5000)
    const { data: deudasAltas, error: errorDeudas } = await supabase
      .from('clientes')
      .select('id, nombre, saldo_total')
      .gt('saldo_total', 5000)
      .eq('is_active', true);

    if (!errorDeudas && deudasAltas.length > 0) {
      deudasAltas.forEach(cliente => {
        alertas.push({
          tipo: 'deuda_alta',
          severidad: 'alta',
          mensaje: `${cliente.nombre} tiene una deuda de $${cliente.saldo_total.toFixed(2)}`,
          clienteId: cliente.id
        });
      });
    }

    // 2. Clientes sin actividad reciente (>30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const { data: sinActividad, error: errorActividad } = await supabase
      .from('clientes')
      .select('id, nombre, ultima_compra')
      .lt('ultima_compra', hace30Dias.toISOString())
      .eq('is_active', true);

    if (!errorActividad && sinActividad.length > 0) {
      sinActividad.slice(0, 5).forEach(cliente => {
        alertas.push({
          tipo: 'sin_actividad',
          severidad: 'media',
          mensaje: `${cliente.nombre} no tiene actividad desde hace más de 30 días`,
          clienteId: cliente.id
        });
      });
    }

    return { success: true, data: alertas };
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// RESUMEN EJECUTIVO
// =====================================================

/**
 * Obtener un resumen completo para ejecutivos
 * @returns {Promise<Object>} Resumen ejecutivo
 */
export const getResumenEjecutivo = async () => {
  try {
    const [stats, topDeudores, tendencias, comparacion, alertas] = await Promise.all([
      getDashboardStats(),
      getTopDeudores(5),
      getTendenciasSemanal(),
      getComparacionMensual(),
      getAlertas()
    ]);

    const resumen = {
      estadisticas: stats.data || {},
      topDeudores: topDeudores.data || [],
      tendencias: tendencias.data || [],
      comparacionMensual: comparacion.data || {},
      alertas: alertas.data || []
    };

    return { success: true, data: resumen };
  } catch (error) {
    console.error('Error al obtener resumen ejecutivo:', error);
    return { success: false, error: error.message };
  }
};
