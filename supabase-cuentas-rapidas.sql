-- =====================================================
-- SCHEMA PARA CUENTAS RÁPIDAS - Sistema de Notas
-- =====================================================
-- Sistema para clientes que consumen en el momento (bar/restaurante)
-- Ejecutar en el SQL Editor de Supabase DESPUÉS del schema principal

-- =====================================================
-- 1. CREAR TABLAS
-- =====================================================

-- Tabla de Cuentas Rápidas (Notas)
CREATE TABLE IF NOT EXISTS public.cuentas_rapidas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre_cliente TEXT NOT NULL,
    mesa TEXT, -- Número de mesa o ubicación (opcional)
    estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'pagada')),
    total DECIMAL(10, 2) DEFAULT 0.00,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
    fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    closed_by UUID REFERENCES auth.users(id)
);

-- Tabla de Items de Cuenta (líneas de la cuenta)
CREATE TABLE IF NOT EXISTS public.cuenta_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cuenta_id UUID REFERENCES public.cuentas_rapidas(id) ON DELETE CASCADE NOT NULL,
    descripcion TEXT NOT NULL, -- Ej: "Cerveza Presidente", "Ron Brugal"
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario > 0),
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- 2. ÍNDICES PARA MEJOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cuentas_rapidas_estado ON public.cuentas_rapidas(estado);
CREATE INDEX IF NOT EXISTS idx_cuentas_rapidas_fecha ON public.cuentas_rapidas(fecha_apertura DESC);
CREATE INDEX IF NOT EXISTS idx_cuentas_rapidas_created_by ON public.cuentas_rapidas(created_by);
CREATE INDEX IF NOT EXISTS idx_cuenta_items_cuenta ON public.cuenta_items(cuenta_id);

-- =====================================================
-- 3. FUNCIONES Y TRIGGERS
-- =====================================================

-- Trigger para updated_at en cuentas_rapidas
CREATE TRIGGER update_cuentas_rapidas_updated_at BEFORE UPDATE ON public.cuentas_rapidas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar el total de la cuenta automáticamente
CREATE OR REPLACE FUNCTION actualizar_total_cuenta()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular el total sumando todos los items de la cuenta
    UPDATE public.cuentas_rapidas
    SET total = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM public.cuenta_items
        WHERE cuenta_id = COALESCE(NEW.cuenta_id, OLD.cuenta_id)
    )
    WHERE id = COALESCE(NEW.cuenta_id, OLD.cuenta_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar total al insertar item
CREATE TRIGGER trigger_actualizar_total_insert
AFTER INSERT ON public.cuenta_items
FOR EACH ROW EXECUTE FUNCTION actualizar_total_cuenta();

-- Trigger para actualizar total al actualizar item
CREATE TRIGGER trigger_actualizar_total_update
AFTER UPDATE ON public.cuenta_items
FOR EACH ROW EXECUTE FUNCTION actualizar_total_cuenta();

-- Trigger para actualizar total al eliminar item
CREATE TRIGGER trigger_actualizar_total_delete
AFTER DELETE ON public.cuenta_items
FOR EACH ROW EXECUTE FUNCTION actualizar_total_cuenta();

-- Función para cerrar una cuenta (marcar como pagada)
CREATE OR REPLACE FUNCTION cerrar_cuenta(cuenta_uuid UUID, metodo TEXT DEFAULT 'efectivo')
RETURNS JSON AS $$
DECLARE
    cuenta_total DECIMAL(10, 2);
    result JSON;
BEGIN
    -- Obtener el total de la cuenta
    SELECT total INTO cuenta_total
    FROM public.cuentas_rapidas
    WHERE id = cuenta_uuid AND estado = 'abierta';

    IF cuenta_total IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cuenta no encontrada o ya está cerrada'
        );
    END IF;

    -- Actualizar la cuenta como pagada
    UPDATE public.cuentas_rapidas
    SET
        estado = 'pagada',
        fecha_cierre = NOW(),
        metodo_pago = metodo,
        closed_by = auth.uid()
    WHERE id = cuenta_uuid;

    RETURN json_build_object(
        'success', true,
        'total', cuenta_total,
        'message', 'Cuenta cerrada exitosamente'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de audit para cuentas_rapidas
CREATE TRIGGER audit_cuentas_rapidas AFTER INSERT OR UPDATE OR DELETE ON public.cuentas_rapidas
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Trigger de audit para cuenta_items
CREATE TRIGGER audit_cuenta_items AFTER INSERT OR UPDATE OR DELETE ON public.cuenta_items
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- =====================================================
-- 4. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.cuentas_rapidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuenta_items ENABLE ROW LEVEL SECURITY;

-- Políticas para CUENTAS_RAPIDAS
-- Todos los usuarios autenticados pueden ver cuentas
CREATE POLICY "Authenticated users can view cuentas rapidas" ON public.cuentas_rapidas
    FOR SELECT USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden crear cuentas
CREATE POLICY "Authenticated users can create cuentas rapidas" ON public.cuentas_rapidas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden actualizar cuentas
CREATE POLICY "Authenticated users can update cuentas rapidas" ON public.cuentas_rapidas
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Solo admins pueden eliminar cuentas
CREATE POLICY "Admins can delete cuentas rapidas" ON public.cuentas_rapidas
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para CUENTA_ITEMS
-- Todos los usuarios autenticados pueden ver items
CREATE POLICY "Authenticated users can view cuenta items" ON public.cuenta_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden crear items
CREATE POLICY "Authenticated users can create cuenta items" ON public.cuenta_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden actualizar items
CREATE POLICY "Authenticated users can update cuenta items" ON public.cuenta_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden eliminar items (para corregir errores)
CREATE POLICY "Authenticated users can delete cuenta items" ON public.cuenta_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener cuentas abiertas
CREATE OR REPLACE FUNCTION get_cuentas_abiertas()
RETURNS TABLE (
    id UUID,
    nombre_cliente TEXT,
    mesa TEXT,
    total DECIMAL(10, 2),
    fecha_apertura TIMESTAMPTZ,
    num_items BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.id,
        cr.nombre_cliente,
        cr.mesa,
        cr.total,
        cr.fecha_apertura,
        COUNT(ci.id) as num_items
    FROM public.cuentas_rapidas cr
    LEFT JOIN public.cuenta_items ci ON cr.id = ci.cuenta_id
    WHERE cr.estado = 'abierta'
    GROUP BY cr.id, cr.nombre_cliente, cr.mesa, cr.total, cr.fecha_apertura
    ORDER BY cr.fecha_apertura DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener items de una cuenta
CREATE OR REPLACE FUNCTION get_cuenta_items(cuenta_uuid UUID)
RETURNS TABLE (
    id UUID,
    descripcion TEXT,
    cantidad INTEGER,
    precio_unitario DECIMAL(10, 2),
    subtotal DECIMAL(10, 2),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ci.id,
        ci.descripcion,
        ci.cantidad,
        ci.precio_unitario,
        ci.subtotal,
        ci.created_at
    FROM public.cuenta_items ci
    WHERE ci.cuenta_id = cuenta_uuid
    ORDER BY ci.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de cuentas
CREATE OR REPLACE FUNCTION get_cuentas_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'cuentas_abiertas', (
            SELECT COUNT(*)
            FROM public.cuentas_rapidas
            WHERE estado = 'abierta'
        ),
        'total_abierto', COALESCE((
            SELECT SUM(total)
            FROM public.cuentas_rapidas
            WHERE estado = 'abierta'
        ), 0),
        'cuentas_pagadas_hoy', (
            SELECT COUNT(*)
            FROM public.cuentas_rapidas
            WHERE estado = 'pagada' AND DATE(fecha_cierre) = CURRENT_DATE
        ),
        'total_pagado_hoy', COALESCE((
            SELECT SUM(total)
            FROM public.cuentas_rapidas
            WHERE estado = 'pagada' AND DATE(fecha_cierre) = CURRENT_DATE
        ), 0)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIN DEL SCHEMA DE CUENTAS RÁPIDAS
-- =====================================================

-- Para verificar que todo se creó correctamente:
-- SELECT * FROM get_cuentas_abiertas();
-- SELECT * FROM get_cuentas_stats();
