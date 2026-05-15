# Matriz de Paridad Modular (Baseline)

Estado: `completo | parcial | faltante`  
Referencia: `src/components/restaurant-platform.tsx` vs rutas/modulos `src/app/academico/*`

| Módulo objetivo | Estado actual | Implementación actual |
|---|---|---|
| dashboard | parcial | `/academico` con `teacher-dashboard` académico |
| tables / salon | parcial | `/academico/servicio` con `SalonMap` |
| orders / pos | parcial | `/academico/servicio` con `PosTerminal` |
| kitchen / kds | parcial | `/academico/servicio` con `KitchenDisplay` |
| cash | parcial | `/academico/caja` (`CashOperationsPanel`) |
| products | parcial | integrado indirecto en POS/recetas |
| recipes | parcial | `recetas-mutations` + selección en POS |
| inventory | parcial | `/academico/inventario` + `/academico/bodega` |
| purchases | parcial | `/academico/compras` (`PurchasesPanel`) |
| crm | parcial | `/academico/crm` (`CrmPanel`) |
| documents | parcial | `/academico/documentos` (`DocumentsPanel`) |
| reports | parcial | `/academico/reportes` (`ReportsPanel`) |
| foodSafety | parcial | `/academico/inocuidad` (`FoodSafetyPanel`) |
| employees | parcial | `/academico/personal` (`EmployeesPanel`) |
| audit | parcial | `/academico/auditoria` (`AuditPanel`) + trazabilidad activa |
| settings | parcial | `/academico/configuracion` (`SettingsPanel`) |
| education | parcial | módulos académicos base ya disponibles |

## Checklist de avance por PR

- [ ] Servicio 360 E2E cerrado (`pedido -> comanda -> entrega -> feedback -> cierre -> stock -> trazabilidad`)
- [ ] Compatibilidad visual validada en `390 / 768 / 1366`
- [ ] Supabase-first operativo + fallback demo coherente
- [ ] Sin hardcodes de simulación (`sim-1`)
- [ ] Módulo impacta otro módulo (sin islas funcionales)
