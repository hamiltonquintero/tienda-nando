import React, { useState, useMemo } from 'react';
import { 
  Package, Search, Plus, Minus, Edit, Trash2, 
  AlertTriangle, DollarSign, TrendingUp, Layers, Check,
  Truck, PackagePlus, CheckCircle2, RotateCcw, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '../data/initialProducts';
import { formatCOP } from '../data/store';
import ConfirmModal from './ConfirmModal';

export default function Inventory({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onUpdateStock, 
  onBulkRestock,
  onDeleteProduct,
  activeAdmin 
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // reemplaza window.confirm()

  // Estado para Entrada de Pedido / Reabastecimiento Rápido
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockQuantities, setRestockQuantities] = useState({});
  const [restockSearch, setRestockSearch] = useState('');
  const [restockCategory, setRestockCategory] = useState('Todos');
  const [isSavingRestock, setIsSavingRestock] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Snacks & Paquetes');
  const [formPrice, setFormPrice] = useState('');
  const [formCost, setFormCost] = useState('');
  const [formStock, setFormStock] = useState('12');
  const [formMinStock, setFormMinStock] = useState('3');
  const [formIcon, setFormIcon] = useState('📦');

  // Inventory Totals
  const totalValueSale = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);
  }, [products]);

  const totalValueCost = useMemo(() => {
    return products.reduce((acc, p) => acc + ((p.cost || p.price * 0.7) * (p.stock || 0)), 0);
  }, [products]);

  const potentialProfit = totalValueSale - totalValueCost;

  const lowStockCount = useMemo(() => {
    return products.filter(p => (p.stock || 0) <= (p.minStock || 3)).length;
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesLowStock = !showLowStockOnly || (p.stock || 0) <= (p.minStock || 3);
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, search, selectedCategory, showLowStockOnly]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Snacks & Paquetes');
    setFormPrice('');
    setFormCost('');
    setFormStock('12');
    setFormMinStock('3');
    setFormIcon('📦');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormCost((p.cost || Math.round(p.price * 0.7)).toString());
    setFormStock(p.stock.toString());
    setFormMinStock((p.minStock || 3).toString());
    setFormIcon(p.icon || '📦');
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;

    const priceNum = Number(formPrice);
    const costNum = formCost ? Number(formCost) : Math.round(priceNum * 0.7);
    const stockNum = Number(formStock) || 0;
    const minStockNum = Number(formMinStock) || 3;

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, {
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        minStock: minStockNum,
        icon: formIcon
      });
    } else {
      onAddProduct({
        name: formName.trim(),
        category: formCategory,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        minStock: minStockNum,
        icon: formIcon
      });
    }

    setIsAddModalOpen(false);
  };

  // Restock handlers
  const handleRestockQtyChange = (id, val) => {
    const numVal = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setRestockQuantities(prev => ({ ...prev, [id]: numVal }));
  };

  const handleQuickAddRestock = (id, delta) => {
    setRestockQuantities(prev => {
      const current = parseInt(prev[id], 10) || 0;
      return { ...prev, [id]: current + delta };
    });
  };

  const handleClearRestock = () => {
    setRestockQuantities({});
  };

  // Filtered products for restock modal
  const restockFilteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(restockSearch.toLowerCase());
      const matchCat = restockCategory === 'Todos' || p.category === restockCategory;
      return matchSearch && matchCat;
    });
  }, [products, restockSearch, restockCategory]);

  const restockSummary = useMemo(() => {
    let totalItems = 0;
    let totalUnits = 0;
    Object.entries(restockQuantities).forEach(([_, qty]) => {
      const q = parseInt(qty, 10) || 0;
      if (q > 0) {
        totalItems += 1;
        totalUnits += q;
      }
    });
    return { totalItems, totalUnits };
  }, [restockQuantities]);

  const handleConfirmRestock = async () => {
    const items = Object.entries(restockQuantities)
      .map(([id, qty]) => ({ id, addQty: parseInt(qty, 10) || 0 }))
      .filter(it => it.addQty > 0);

    if (items.length === 0) return;

    setIsSavingRestock(true);
    try {
      await onBulkRestock(items);
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      } catch (e) {}
      setIsRestockModalOpen(false);
      setRestockQuantities({});
    } catch (err) {
      console.error('Error al guardar reabastecimiento:', err);
    } finally {
      setIsSavingRestock(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--brand-blue)', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="var(--brand-blue)" />
            Total de Productos
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-blue)', marginTop: '6px' }}>
            {products.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>referencias</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {products.reduce((acc, p) => acc + (p.stock || 0), 0)} unidades en stock total
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #16a34a', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DollarSign size={16} color="#16a34a" />
            Valor del Inventario (Venta)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
            {formatCOP(totalValueSale)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Costo: {formatCOP(totalValueCost)}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #d97706', background: '#ffffff' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} color="#d97706" />
            Ganancia Proyectada
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {formatCOP(potentialProfit)}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Margen de utilidad esperado
          </div>
        </div>

        <div 
          className="card" 
          style={{ 
            borderLeft: '4px solid #dc2626', 
            cursor: 'pointer',
            background: showLowStockOnly ? '#fee2e2' : '#ffffff'
          }}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="#dc2626" />
            Stock Bajo / Agotados
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
            {lowStockCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>productos</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {showLowStockOnly ? 'Mostrando solo agotados (Clic para ver todos)' : 'Clic para filtrar por agotar'}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="text"
              placeholder="Buscar en el inventario..."
              className="input"
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="select" 
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            className="btn btn-success" 
            onClick={() => {
              setRestockQuantities({});
              setRestockSearch('');
              setRestockCategory('Todos');
              setIsRestockModalOpen(true);
            }}
            title="Ingresar pedido completo de la distribuidora"
            style={{ background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Truck size={18} />
            <span>Entrada de Pedido</span>
          </button>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Inventory Table / Grid */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Producto</th>
                <th style={{ padding: '12px 16px' }}>Categoría</th>
                <th style={{ padding: '12px 16px' }}>Precio Venta</th>
                <th style={{ padding: '12px 16px' }}>Costo / Margen</th>
                <th style={{ padding: '12px 16px' }}>Stock Actual</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ajustar Stock Rápido</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, idx) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= (p.minStock || 3);
                const margin = p.price - (p.cost || p.price * 0.7);

                return (
                  <tr 
                    key={p.id}
                    style={{ 
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{p.icon || '📦'}</span>
                        <div>
                          <div style={{ color: 'var(--text-main)', fontSize: '0.92rem' }}>{p.name}</div>
                          {isOutOfStock && <span className="badge badge-danger">Agotado</span>}
                          {isLowStock && <span className="badge badge-warning">Stock Bajo</span>}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {p.category}
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--brand-blue)' }}>
                      {formatCOP(p.price)}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        Costo: {formatCOP(p.cost || p.price * 0.7)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                        +{formatCOP(margin)} utilidad
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '1.05rem', 
                        fontWeight: 800, 
                        color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#0f172a' 
                      }}>
                        {p.stock}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '4px' }}>unid.</span>
                    </td>

                    {/* Quick Restock Buttons */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => onUpdateStock(p.id, -1)}
                          disabled={p.stock <= 0}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            cursor: p.stock <= 0 ? 'not-allowed' : 'pointer'
                          }}
                          title="Restar 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => onUpdateStock(p.id, 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                          title="Sumar 1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => onUpdateStock(p.id, 5)}
                          style={{
                            padding: '3px 10px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            color: '#0369a1',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Surtir +5"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => onUpdateStock(p.id, 10)}
                          style={{
                            padding: '3px 10px',
                            height: '28px',
                            borderRadius: '6px',
                            background: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            color: '#15803d',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title="Surtir +10"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '6px' }}
                          onClick={() => handleOpenEdit(p)}
                          title="Editar producto"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: '6px', borderRadius: '6px', color: '#ef4444' }}
                          onClick={() => setDeleteTarget(p)}
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Eliminar producto"
        message={`¿Estás seguro de eliminar "${deleteTarget?.name}" del inventario? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          onDeleteProduct(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package color="#38bdf8" />
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto al Inventario'}
            </h2>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Nombre del Producto: *
                </label>
                <input 
                  type="text" 
                  className="input" 
                  required 
                  placeholder="ej. Papas Rizadas, Bon Bon Bum..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Categoría:
                  </label>
                  <select 
                    className="select"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {CATEGORIES.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Ícono / Emoji:
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="📦, 🍪, 🥤, 🍫..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Precio de Venta (COP): *
                  </label>
                  <input 
                    type="number" 
                    className="input" 
                    required 
                    min="50"
                    placeholder="ej. 2000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Precio de Costo (COP):
                  </label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="ej. 1500 (opcional)"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Stock Actual (Unidades):
                  </label>
                  <input 
                    type="number" 
                    className="input" 
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Alerta de Stock Mínimo:
                  </label>
                  <input 
                    type="number" 
                    className="input" 
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar Cambios' : 'Agregar al Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENTRADA DE PEDIDO / REABASTECIMIENTO RÁPIDO */}
      {isRestockModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => { if (!isSavingRestock) setIsRestockModalOpen(false); }}
          style={{ zIndex: 1050 }}
        >
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '820px', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '24px',
              overflow: 'hidden'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '12px', 
                  background: '#dcfce7', 
                  color: '#16a34a', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Truck size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                    Entrada de Pedido / Reabastecimiento Rápido
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Ingresa las cantidades que llegaron de la distribuidora para actualizar el stock de golpe.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { if (!isSavingRestock) setIsRestockModalOpen(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                aria-label="Cerrar modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Filter Bar inside Modal */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexShrink: 0 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="text"
                  placeholder="Buscar en el pedido (ej. papas, galletas, jugo)..."
                  className="input"
                  style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                  value={restockSearch}
                  onChange={(e) => setRestockSearch(e.target.value)}
                />
              </div>

              <select 
                className="select" 
                style={{ width: 'auto', fontSize: '0.88rem' }}
                value={restockCategory}
                onChange={(e) => setRestockCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Products List for Restock */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              paddingRight: '4px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              background: '#f8fafc'
            }}>
              {restockFilteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                  No se encontraron productos que coincidan con la búsqueda.
                </div>
              ) : (
                restockFilteredProducts.map(p => {
                  const qtyEntered = parseInt(restockQuantities[p.id], 10) || 0;
                  const newStock = p.stock + qtyEntered;

                  return (
                    <div 
                      key={p.id}
                      style={{
                        background: qtyEntered > 0 ? '#f0fdf4' : '#ffffff',
                        border: qtyEntered > 0 ? '1.5px solid #86efac' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '10px 14px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Left: Product Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '1 1 auto' }}>
                        <span style={{ fontSize: '1.6rem' }}>{p.icon || '📦'}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                            <span>{p.category}</span>
                            <span>•</span>
                            <span>Stock actual: <strong>{p.stock}</strong></span>
                            {p.stock <= (p.minStock || 3) && (
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>⚠️ Bajo</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Chips & Number Input */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Quick increment chips */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[6, 12, 24, 30].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleQuickAddRestock(p.id, val)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#f1f5f9',
                                color: '#0f172a',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'background 0.15s ease'
                              }}
                              title={`Sumar ${val} unidades`}
                            >
                              +{val}
                            </button>
                          ))}
                        </div>

                        {/* Direct input */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>+</span>
                          <input 
                            type="number"
                            min="0"
                            placeholder="0"
                            className="input"
                            style={{
                              width: '75px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              padding: '6px 8px',
                              borderColor: qtyEntered > 0 ? '#16a34a' : '#cbd5e1',
                              background: qtyEntered > 0 ? '#ffffff' : '#f8fafc'
                            }}
                            value={restockQuantities[p.id] ?? ''}
                            onChange={(e) => handleRestockQtyChange(p.id, e.target.value)}
                          />
                        </div>

                        {/* Resulting Stock Indicator */}
                        {qtyEntered > 0 && (
                          <div style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}>
                            Quedará: {newStock}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Action Buttons */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap',
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '16px', 
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  background: restockSummary.totalUnits > 0 ? '#dcfce7' : '#f1f5f9',
                  color: restockSummary.totalUnits > 0 ? '#15803d' : 'var(--text-muted)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '0.85rem'
                }}>
                  {restockSummary.totalUnits > 0 
                    ? `📦 ${restockSummary.totalItems} productos · ${restockSummary.totalUnits} unidades a ingresar` 
                    : 'Ingresa cantidades para sumar al stock'}
                </div>

                {restockSummary.totalUnits > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRestock}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  disabled={isSavingRestock}
                  onClick={() => setIsRestockModalOpen(false)}
                >
                  Cancelar
                </button>

                <button 
                  type="button" 
                  className="btn btn-success"
                  disabled={restockSummary.totalUnits === 0 || isSavingRestock}
                  onClick={handleConfirmRestock}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#16a34a', color: '#fff' }}
                >
                  <CheckCircle2 size={18} />
                  {isSavingRestock ? 'Guardando entrada…' : `Confirmar Entrada (+${restockSummary.totalUnits} unid.)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
