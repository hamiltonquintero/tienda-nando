import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { INITIAL_PRODUCTS, INITIAL_ADMINS, INITIAL_CUSTOMERS } from './initialProducts';

// ─────────────────────────────────────────────────────────────
// Utilidades exportadas (sin cambios — los componentes las usan)
// ─────────────────────────────────────────────────────────────
export const formatCOP = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '$0';
  return '$ ' + Math.round(val).toLocaleString('es-CO');
};

export const getCurrentQuincenaName = () => {
  const now = new Date();
  const day = now.getDate();
  const months = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  const qNumber = day <= 15 ? '1ra' : '2da';
  return `${qNumber} Quincena de ${months[now.getMonth()]} ${now.getFullYear()}`;
};

// ─────────────────────────────────────────────────────────────
// Mapeadores: snake_case (DB) ↔ camelCase (app)
// ─────────────────────────────────────────────────────────────
const mapProduct = (r) => ({
  id: r.id, name: r.name, price: Number(r.price), cost: Number(r.cost),
  category: r.category, stock: r.stock, minStock: r.min_stock, icon: r.icon
});

const mapCustomer = (r) => ({
  id: r.id, name: r.name, area: r.area, phone: r.phone,
  totalDebt: Number(r.total_debt)
});

const mapAdmin = (r) => ({
  id: r.id, name: r.name, pin: r.pin, role: r.role
});

const mapPeriod = (r) => ({
  id: r.id,
  name: r.name,
  startDate: r.start_date,
  endDate: r.end_date ?? null,
  closedBy: r.closed_by ?? null,
  totalCash: r.total_cash != null ? Number(r.total_cash) : null,
  totalCredit: r.total_credit != null ? Number(r.total_credit) : null,
  totalCollected: r.total_collected != null ? Number(r.total_collected) : null,
  salesCount: r.sales_count ?? null,
});

const mapSale = (r) => ({
  id: r.id,
  date: r.date,
  type: r.type,
  paymentMethod: r.payment_method,
  customerId: r.customer_id,
  customerName: r.customer_name,
  total: Number(r.total),
  adminId: r.admin_id,
  adminName: r.admin_name,
  periodId: r.period_id,
  paid: r.paid,
  // items se carga aparte y se mezcla en loadSales()
  items: r.sale_items
    ? r.sale_items.map(i => ({
        id: i.product_id,
        name: i.name,
        price: Number(i.price),
        cost: Number(i.cost),
        quantity: i.quantity,
        total: Number(i.total)
      }))
    : []
});

const mapPayment = (r) => ({
  id: r.id,
  date: r.date,
  customerId: r.customer_id,
  customerName: r.customer_name,
  amount: Number(r.amount),
  paymentMethod: r.payment_method,
  notes: r.notes,
  adminId: r.admin_id,
  adminName: r.admin_name,
  periodId: r.period_id
});

// ─────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────
export function useStore() {
  const [products,        setProducts]        = useState([]);
  const [customers,       setCustomers]       = useState([]);
  const [sales,           setSales]           = useState([]);
  const [payments,        setPayments]        = useState([]);
  const [admins,          setAdmins]          = useState([]);
  const [activeAdminId,   setActiveAdminId]   = useState('admin-1');
  const [currentPeriod,   setCurrentPeriod]   = useState(null);
  const [archivedPeriods, setArchivedPeriods] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // activeAdminId se guarda solo en localStorage (es local a cada dispositivo)
  useEffect(() => {
    const saved = localStorage.getItem('surtimueve_active_admin_v2');
    if (saved) setActiveAdminId(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem('surtimueve_active_admin_v2', activeAdminId);
  }, [activeAdminId]);

  const activeAdmin = admins.find(a => a.id === activeAdminId) || admins[0] || null;

  // ── Carga inicial ──────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        { data: prods,  error: e1 },
        { data: custs,  error: e2 },
        { data: admns,  error: e3 },
        { data: perds,  error: e4 },
        { data: slsRaw, error: e5 },
        { data: pays,   error: e6 },
      ] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('customers').select('*').order('name'),
        supabase.from('admins').select('*'),
        supabase.from('periods').select('*').order('start_date', { ascending: false }),
        supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false }),
        supabase.from('payments').select('*').order('date', { ascending: false }),
      ]);

      const firstError = e1 || e2 || e3 || e4 || e5 || e6;
      if (firstError) throw firstError;

      setProducts(prods.map(mapProduct));
      setCustomers(custs.map(mapCustomer));
      setAdmins(admns.map(mapAdmin));
      setSales(slsRaw.map(mapSale));
      setPayments(pays.map(mapPayment));

      const mappedPeriods = perds.map(mapPeriod);
      const open   = mappedPeriods.find(p => !p.endDate) ?? null;
      const closed = mappedPeriods.filter(p => !!p.endDate);
      setCurrentPeriod(open);
      setArchivedPeriods(closed);

    } catch (err) {
      console.error('[store] Error cargando datos:', err);
      setError(err.message ?? 'Error de conexión con la base de datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Suscripciones Realtime ─────────────────────────────────
  // Cuando cualquiera de los dos teléfonos hace un cambio,
  // el otro recibe el evento y recarga solo la tabla afectada.
  useEffect(() => {
    const channel = supabase
      .channel('surtimueve-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data } = await supabase.from('products').select('*').order('name');
        if (data) setProducts(data.map(mapProduct));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, async () => {
        const { data } = await supabase.from('customers').select('*').order('name');
        if (data) setCustomers(data.map(mapCustomer));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
        const { data } = await supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false });
        if (data) setSales(data.map(mapSale));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sale_items' }, async () => {
        // sale_items cambiaron → recargar sales completo con items
        const { data } = await supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false });
        if (data) setSales(data.map(mapSale));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, async () => {
        const { data } = await supabase.from('payments').select('*').order('date', { ascending: false });
        if (data) setPayments(data.map(mapPayment));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'periods' }, async () => {
        const { data } = await supabase.from('periods').select('*').order('start_date', { ascending: false });
        if (data) {
          const mapped = data.map(mapPeriod);
          setCurrentPeriod(mapped.find(p => !p.endDate) ?? null);
          setArchivedPeriods(mapped.filter(p => !!p.endDate));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, async () => {
        const { data } = await supabase.from('admins').select('*');
        if (data) setAdmins(data.map(mapAdmin));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── ACCIONES ──────────────────────────────────────────────

  const recordSale = async ({ type, customerId = null, customerName = null, items, total, paymentMethod = 'efectivo' }) => {
    if (!activeAdmin || !currentPeriod) return null;
    const saleId = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const saleDate = new Date().toISOString();

    // 1. Insertar venta
    const { error: saleErr } = await supabase.from('sales').insert({
      id: saleId,
      date: saleDate,
      type,
      payment_method: paymentMethod,
      customer_id: customerId,
      customer_name: customerName,
      total,
      admin_id: activeAdmin.id,
      admin_name: activeAdmin.name,
      period_id: currentPeriod.id,
      paid: type === 'contado'
    });
    if (saleErr) {
      console.error('[store] Error insertando venta:', saleErr);
      throw new Error(saleErr.message);
    }

    // 2. Insertar líneas de venta
    const saleItemsRows = items.map(i => ({
      sale_id: saleId,
      product_id: i.id,
      name: i.name,
      price: i.price,
      cost: i.cost ?? Math.round(i.price * 0.7),
      quantity: i.quantity,
      total: i.price * i.quantity
    }));
    const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsRows);
    if (itemsErr) console.error('[store] Error insertando items:', itemsErr);

    // 3. Descontar stock de cada producto
    for (const item of items) {
      const prod = products.find(p => p.id === item.id);
      if (!prod) continue;
      const newStock = Math.max(0, prod.stock - item.quantity);
      await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
    }
    setProducts(prev => prev.map(p => {
      const it = items.find(i => i.id === p.id);
      return it ? { ...p, stock: Math.max(0, p.stock - it.quantity) } : p;
    }));

    // 4. Si es fiado, incrementar deuda del cliente
    if (type === 'fiado' && customerId) {
      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        const newDebt = Number(cust.totalDebt || 0) + total;
        await supabase.from('customers')
          .update({ total_debt: newDebt })
          .eq('id', customerId);
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, totalDebt: newDebt } : c));
      }
    }

    const newSale = {
      id: saleId,
      date: saleDate,
      type,
      paymentMethod,
      customerId,
      customerName,
      total,
      adminId: activeAdmin.id,
      adminName: activeAdmin.name,
      periodId: currentPeriod.id,
      paid: type === 'contado',
      items: saleItemsRows.map(i => ({
        id: i.product_id,
        name: i.name,
        price: Number(i.price),
        cost: Number(i.cost),
        quantity: i.quantity,
        total: Number(i.total)
      }))
    };
    setSales(prev => [newSale, ...prev]);

    return newSale;
  };

  const recordPayment = async ({ customerId, amount, paymentMethod = 'efectivo', notes = '' }) => {
    const targetCust = customers.find(c => c.id === customerId);
    if (!targetCust || !activeAdmin || !currentPeriod) return null;

    const paymentId = `pay-${Date.now()}`;
    const paymentDate = new Date().toISOString();
    const { error: payErr } = await supabase.from('payments').insert({
      id: paymentId,
      date: paymentDate,
      customer_id: customerId,
      customer_name: targetCust.name,
      amount: Number(amount),
      payment_method: paymentMethod,
      notes,
      admin_id: activeAdmin.id,
      admin_name: activeAdmin.name,
      period_id: currentPeriod.id
    });
    if (payErr) {
      console.error('[store] Error registrando pago:', payErr);
      throw new Error(payErr.message);
    }

    // Reducir deuda del cliente
    const newDebt = Math.max(0, Number(targetCust.totalDebt) - Number(amount));
    await supabase.from('customers').update({ total_debt: newDebt }).eq('id', customerId);

    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, totalDebt: newDebt } : c));
    const newPayment = {
      id: paymentId,
      date: paymentDate,
      customerId,
      customerName: targetCust.name,
      amount: Number(amount),
      paymentMethod,
      notes,
      adminId: activeAdmin.id,
      adminName: activeAdmin.name,
      periodId: currentPeriod.id
    };
    setPayments(prev => [newPayment, ...prev]);

    return newPayment;
  };

  const addProduct = async (prodData) => {
    const newProd = {
      id: `prod-${Date.now()}`,
      name: prodData.name.trim(),
      price: Number(prodData.price),
      cost: prodData.cost ? Number(prodData.cost) : Math.round(Number(prodData.price) * 0.7),
      category: prodData.category,
      stock: Number(prodData.stock ?? 10),
      min_stock: Number(prodData.minStock ?? 3),
      icon: prodData.icon || '📦'
    };
    const { error } = await supabase.from('products').insert(newProd);
    if (error) {
      console.error('[store] Error agregando producto:', error);
      throw new Error(error.message);
    }
    const mapped = mapProduct(newProd);
    setProducts(prev => [...prev.filter(p => p.id !== mapped.id), mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  };

  const updateProduct = async (id, updates) => {
    const dbUpdates = {};
    if (updates.name      !== undefined) dbUpdates.name      = updates.name;
    if (updates.price     !== undefined) dbUpdates.price     = Number(updates.price);
    if (updates.cost      !== undefined) dbUpdates.cost      = Number(updates.cost);
    if (updates.category  !== undefined) dbUpdates.category  = updates.category;
    if (updates.stock     !== undefined) dbUpdates.stock     = Number(updates.stock);
    if (updates.minStock  !== undefined) dbUpdates.min_stock = Number(updates.minStock);
    if (updates.icon      !== undefined) dbUpdates.icon      = updates.icon;
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('[store] Error actualizando producto:', error);
      throw new Error(error.message);
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const updateStock = async (id, delta) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const newStock = Math.max(0, prod.stock + delta);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
    if (error) {
      console.error('[store] Error actualizando stock:', error);
      throw new Error(error.message);
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
  };

  const deleteProduct = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('[store] Error eliminando producto:', error);
      throw new Error(error.message);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addCustomer = async ({ name, area = '', phone = '' }) => {
    const newCust = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      area: area.trim(),
      phone: phone.trim(),
      total_debt: 0
    };
    const { error } = await supabase.from('customers').insert(newCust);
    if (error) {
      console.error('[store] Error agregando cliente:', error);
      throw new Error(error.message);
    }
    const mapped = mapCustomer(newCust);
    setCustomers(prev => [...prev.filter(c => c.id !== mapped.id), mapped].sort((a, b) => a.name.localeCompare(b.name)));
    return mapped;
  };

  const updateCustomer = async (id, updates) => {
    const dbUpdates = {};
    if (updates.name      !== undefined) dbUpdates.name       = updates.name;
    if (updates.area      !== undefined) dbUpdates.area       = updates.area;
    if (updates.phone     !== undefined) dbUpdates.phone      = updates.phone;
    if (updates.totalDebt !== undefined) dbUpdates.total_debt = Number(updates.totalDebt);
    const { error } = await supabase.from('customers').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('[store] Error actualizando cliente:', error);
      throw new Error(error.message);
    }
    setCustomers(prev => prev.map(c => c.id === id ? {
      ...c,
      ...updates,
      totalDebt: updates.totalDebt !== undefined ? Number(updates.totalDebt) : c.totalDebt
    } : c));
  };

  const deleteCustomer = async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('[store] Error eliminando cliente:', error);
      throw new Error(error.message);
    }
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const closeCurrentPeriod = async () => {
    if (!currentPeriod || !activeAdmin) return null;

    const periodSales    = sales.filter(s => s.periodId === currentPeriod.id);
    const periodPayments = payments.filter(p => p.periodId === currentPeriod.id);

    const totalCash      = periodSales.filter(s => s.type === 'contado').reduce((a, s) => a + s.total, 0);
    const totalCredit    = periodSales.filter(s => s.type === 'fiado').reduce((a, s) => a + s.total, 0);
    const totalCollected = periodPayments.reduce((a, p) => a + p.amount, 0);

    // Cerrar el período actual
    const { error: closeErr } = await supabase.from('periods').update({
      end_date:        new Date().toISOString(),
      closed_by:       activeAdmin.name,
      total_cash:      totalCash,
      total_credit:    totalCredit,
      total_collected: totalCollected,
      sales_count:     periodSales.length
    }).eq('id', currentPeriod.id);
    if (closeErr) { console.error('[store] Error cerrando período:', closeErr); return null; }

    // Crear el nuevo período
    const newPeriodId = `period-${Date.now()}`;
    const newStartDate = new Date().toISOString();
    const newName = getCurrentQuincenaName();
    const { error: newErr } = await supabase.from('periods').insert({
      id:         newPeriodId,
      name:       newName,
      start_date: newStartDate
    });
    if (newErr) console.error('[store] Error creando nuevo período:', newErr);

    const closedPeriodObj = {
      ...currentPeriod,
      endDate: new Date().toISOString(),
      closedBy: activeAdmin.name,
      totalCash,
      totalCredit,
      totalCollected,
      salesCount: periodSales.length
    };
    const newPeriodObj = {
      id: newPeriodId,
      name: newName,
      startDate: newStartDate,
      endDate: null,
      closedBy: null,
      totalCash: null,
      totalCredit: null,
      totalCollected: null,
      salesCount: null
    };

    setArchivedPeriods(prev => [closedPeriodObj, ...prev]);
    setCurrentPeriod(newPeriodObj);

    return closedPeriodObj;
  };

  const updateAdminPin = async (adminId, newPin) => {
    if (!newPin || newPin.length < 4) return false;
    const { error } = await supabase.from('admins').update({ pin: newPin }).eq('id', adminId);
    if (error) { console.error('[store] Error actualizando PIN:', error); return false; }
    setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, pin: newPin } : a));
    return true;
  };

  // ── Backup / Restore (sigue funcionando como exportación local) ──
  const exportBackupJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      products,
      customers,
      sales,
      payments,
      admins,
      currentPeriod,
      archivedPeriods
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `surtimueve-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackupJSON = async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      const isArr = (v) => Array.isArray(v);
      const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

      if (
        (data.products && !isArr(data.products)) ||
        (data.customers && !isArr(data.customers)) ||
        (data.sales && !isArr(data.sales)) ||
        (data.payments && !isArr(data.payments)) ||
        (data.admins && !isArr(data.admins)) ||
        (data.archivedPeriods && !isArr(data.archivedPeriods)) ||
        (data.currentPeriod && !isObj(data.currentPeriod))
      ) return false;

      if (!data.products && !data.customers && !data.sales) return false;

      // Upsert todo en Supabase
      if (isArr(data.products) && data.products.length > 0) {
        await supabase.from('products').upsert(
          data.products.map(p => ({
            id: p.id, name: p.name, price: p.price, cost: p.cost,
            category: p.category, stock: p.stock, min_stock: p.minStock ?? 3, icon: p.icon ?? '📦'
          }))
        );
      }
      if (isArr(data.customers) && data.customers.length > 0) {
        await supabase.from('customers').upsert(
          data.customers.map(c => ({
            id: c.id, name: c.name, area: c.area ?? '', phone: c.phone ?? '', total_debt: c.totalDebt ?? 0
          }))
        );
      }
      if (isArr(data.admins) && data.admins.length > 0) {
        await supabase.from('admins').upsert(
          data.admins.map(a => ({ id: a.id, name: a.name, pin: a.pin, role: a.role }))
        );
      }
      // Recargar todo
      await loadAll();
      return true;
    } catch (e) {
      console.error('[store] Error importando backup:', e);
      return false;
    }
  };

  const resetAllDataToDefault = async () => {
    // Eliminar todo y volver a insertar el seed inicial
    await Promise.all([
      supabase.from('sale_items').delete().neq('id', 0),
      supabase.from('payments').delete().neq('id', ''),
      supabase.from('sales').delete().neq('id', ''),
      supabase.from('periods').delete().neq('id', ''),
      supabase.from('customers').delete().neq('id', ''),
    ]);

    // Volver a insertar datos iniciales
    await supabase.from('products').upsert(
      INITIAL_PRODUCTS.map(p => ({
        id: p.id, name: p.name, price: p.price, cost: p.cost,
        category: p.category, stock: p.stock, min_stock: p.minStock, icon: p.icon
      }))
    );
    await supabase.from('admins').upsert(
      INITIAL_ADMINS.map(a => ({ id: a.id, name: a.name, pin: a.pin, role: a.role }))
    );
    await supabase.from('customers').upsert(
      INITIAL_CUSTOMERS.map(c => ({
        id: c.id, name: c.name, area: c.area ?? '', phone: c.phone ?? '', total_debt: 0
      }))
    );
    await supabase.from('periods').insert({
      id:         `period-${Date.now()}`,
      name:       getCurrentQuincenaName(),
      start_date: new Date().toISOString()
    });

    await loadAll();
  };

  return {
    // Estado
    products,
    customers,
    sales,
    payments,
    admins,
    activeAdmin,
    setActiveAdminId,
    currentPeriod,
    archivedPeriods,
    loading,
    error,
    // Acciones
    recordSale,
    recordPayment,
    addProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    closeCurrentPeriod,
    exportBackupJSON,
    importBackupJSON,
    resetAllDataToDefault,
    updateAdminPin,
  };
}
