-- =====================================================
-- SCHEMA DE BASE DE DATOS - CONTROL DE LICORERÍA
-- =====================================================
-- Este archivo contiene todas las tablas, funciones y políticas RLS
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- 1. HABILITAR EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. CREAR TABLAS
-- =====================================================

-- Tabla de Perfiles de Usuario (extendiendo auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'moderador' CHECK (role IN ('admin', 'moderador')),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    telefono TEXT,
    direccion TEXT,
    email TEXT,
    notas TEXT,
    saldo_total DECIMAL(10, 2) DEFAULT 0.00,
    ultima_compra TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de Transacciones
CREATE TABLE IF NOT EXISTS public.transacciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('venta', 'pago')),
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    descripcion TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'otro')),
    referencia TEXT, -- Número de referencia para pagos
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Tabla de Audit Log (registro de cambios)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. ÍNDICES PARA MEJOR PERFORMANCE
-- =====================================================

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON public.clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_saldo ON public.clientes(saldo_total) WHERE saldo_total > 0;
CREATE INDEX IF NOT EXISTS idx_clientes_active ON public.clientes(is_active);

-- Índices para transacciones
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente ON public.transacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON public.transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON public.transacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_created_by ON public.transacciones(created_by);

-- Índices para audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- =====================================================
-- 4. FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transacciones_updated_at BEFORE UPDATE ON public.transacciones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar saldo del cliente automáticamente
CREATE OR REPLACE FUNCTION actualizar_saldo_cliente()
RETURNS TRIGGER AS $$
BEGIN
    -- Si es una venta, suma al saldo
    IF NEW.tipo = 'venta' THEN
        UPDATE public.clientes
        SET saldo_total = saldo_total + NEW.monto,
            ultima_compra = NEW.fecha
        WHERE id = NEW.cliente_id;

    -- Si es un pago, resta del saldo
    ELSIF NEW.tipo = 'pago' THEN
        UPDATE public.clientes
        SET saldo_total = saldo_total - NEW.monto
        WHERE id = NEW.cliente_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar saldo al insertar transacción
CREATE TRIGGER trigger_actualizar_saldo_insert
AFTER INSERT ON public.transacciones
FOR EACH ROW EXECUTE FUNCTION actualizar_saldo_cliente();

-- Función para revertir saldo al eliminar transacción
CREATE OR REPLACE FUNCTION revertir_saldo_cliente()
RETURNS TRIGGER AS $$
BEGIN
    -- Si era venta, resta del saldo
    IF OLD.tipo = 'venta' THEN
        UPDATE public.clientes
        SET saldo_total = saldo_total - OLD.monto
        WHERE id = OLD.cliente_id;

    -- Si era pago, suma al saldo
    ELSIF OLD.tipo = 'pago' THEN
        UPDATE public.clientes
        SET saldo_total = saldo_total + OLD.monto
        WHERE id = OLD.cliente_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para revertir saldo al eliminar transacción
CREATE TRIGGER trigger_revertir_saldo_delete
BEFORE DELETE ON public.transacciones
FOR EACH ROW EXECUTE FUNCTION revertir_saldo_cliente();

-- Función para audit log
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, user_id)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, old_data, user_id)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de audit para cada tabla
CREATE TRIGGER audit_clientes AFTER INSERT OR UPDATE OR DELETE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_transacciones AFTER INSERT OR UPDATE OR DELETE ON public.transacciones
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- =====================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden insertar perfiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para CLIENTES
-- Todos los usuarios autenticados pueden ver clientes
CREATE POLICY "Authenticated users can view clientes" ON public.clientes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden crear clientes
CREATE POLICY "Authenticated users can create clientes" ON public.clientes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden actualizar clientes
CREATE POLICY "Authenticated users can update clientes" ON public.clientes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Solo admins pueden eliminar clientes
CREATE POLICY "Admins can delete clientes" ON public.clientes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para TRANSACCIONES
-- Todos los usuarios autenticados pueden ver transacciones
CREATE POLICY "Authenticated users can view transacciones" ON public.transacciones
    FOR SELECT USING (auth.role() = 'authenticated');

-- Todos los usuarios autenticados pueden crear transacciones
CREATE POLICY "Authenticated users can create transacciones" ON public.transacciones
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Los usuarios pueden actualizar sus propias transacciones creadas hace menos de 24 horas
CREATE POLICY "Users can update own recent transacciones" ON public.transacciones
    FOR UPDATE USING (
        created_by = auth.uid() AND
        created_at > (NOW() - INTERVAL '24 hours')
    );

-- Admins pueden actualizar cualquier transacción
CREATE POLICY "Admins can update any transaccion" ON public.transacciones
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Solo admins pueden eliminar transacciones
CREATE POLICY "Admins can delete transacciones" ON public.transacciones
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas para AUDIT_LOGS
-- Solo admins pueden ver audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 6. FUNCIONES ÚTILES PARA LA APLICACIÓN
-- =====================================================

-- Función para obtener estadísticas del dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_clientes', (SELECT COUNT(*) FROM public.clientes WHERE is_active = true),
        'clientes_con_deuda', (SELECT COUNT(*) FROM public.clientes WHERE saldo_total > 0 AND is_active = true),
        'total_deudas', COALESCE((SELECT SUM(saldo_total) FROM public.clientes WHERE is_active = true), 0),
        'pagos_hoy', COALESCE((
            SELECT SUM(monto) FROM public.transacciones
            WHERE tipo = 'pago' AND DATE(fecha) = CURRENT_DATE
        ), 0),
        'ventas_hoy', COALESCE((
            SELECT SUM(monto) FROM public.transacciones
            WHERE tipo = 'venta' AND DATE(fecha) = CURRENT_DATE
        ), 0)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener top deudores
CREATE OR REPLACE FUNCTION get_top_deudores(limit_count INT DEFAULT 5)
RETURNS TABLE (
    id UUID,
    nombre TEXT,
    telefono TEXT,
    deuda DECIMAL(10, 2),
    ultima_compra TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.nombre, c.telefono, c.saldo_total, c.ultima_compra
    FROM public.clientes c
    WHERE c.saldo_total > 0 AND c.is_active = true
    ORDER BY c.saldo_total DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener historial de un cliente
CREATE OR REPLACE FUNCTION get_cliente_historial(cliente_uuid UUID)
RETURNS TABLE (
    id UUID,
    tipo TEXT,
    monto DECIMAL(10, 2),
    descripcion TEXT,
    fecha TIMESTAMPTZ,
    metodo_pago TEXT,
    created_by_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.tipo,
        t.monto,
        t.descripcion,
        t.fecha,
        t.metodo_pago,
        p.email as created_by_email
    FROM public.transacciones t
    LEFT JOIN public.profiles p ON t.created_by = p.id
    WHERE t.cliente_id = cliente_uuid
    ORDER BY t.fecha DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar clientes de prueba (descomenta si quieres datos de ejemplo)
/*
INSERT INTO public.clientes (nombre, telefono, direccion, saldo_total, ultima_compra) VALUES
('Juan Pérez', '809-555-0101', 'Calle Principal #123, Santo Domingo', 2500.00, '2025-01-10'),
('María García', '809-555-0102', 'Av. Independencia #456, Santiago', 1200.50, '2025-01-12'),
('Carlos Rodríguez', '809-555-0103', 'Calle Duarte #789, La Vega', 0, '2025-01-08'),
('Ana Martínez', '809-555-0104', 'Av. Estrella Sadhalá #321, Santiago', 3750.25, '2025-01-14'),
('Luis Hernández', '809-555-0105', 'Calle Sánchez #654, Puerto Plata', 500.00, '2025-01-13');
*/

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

-- Para verificar que todo se creó correctamente:
-- SELECT * FROM get_dashboard_stats();
-- SELECT * FROM get_top_deudores();
