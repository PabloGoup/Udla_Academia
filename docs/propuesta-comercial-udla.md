# Propuesta comercial ejecutiva

# Plataforma gastronomica academica UDLA

Fecha de referencia: 12 de mayo de 2026  
Cliente objetivo: Universidad de Las Americas - area gastronomica / laboratorios de simulacion  
Moneda de referencia: UF  
UF de referencia: $40.290,47 CLP  
IVA referencial: 19%

> Los valores en pesos son referenciales. Para una propuesta formal se recomienda cotizar en UF y calcular el monto en CLP segun la UF del dia de facturacion.

## 1. Resumen ejecutivo

Se propone desarrollar e implementar una plataforma web gastronomica orientada a la ensenanza, simulacion y administracion de procesos reales de un restaurante presencial.

La solucion no compite directamente como "otro POS". Su diferenciacion esta en combinar operacion de restaurante con practica academica: mesas, pedidos, cocina, caja, productos, recetas, inventario, compras, costeo, mermas, seguridad alimentaria, reportes y simulaciones evaluables para estudiantes.

El objetivo comercial es entrar con una propuesta realista, progresiva y verificable, considerando que somos una empresa emergente y que la universidad necesita reducir riesgo antes de comprometer una implementacion institucional mayor.

## 2. Problema que resuelve

Las plataformas POS tradicionales permiten vender, cobrar y administrar un restaurante. Sin embargo, normalmente no estan disenadas para laboratorios gastronomicos ni para procesos de evaluacion academica.

La universidad necesita una herramienta que permita:

- Simular la operacion real de un restaurante presencial.
- Practicar procesos de salon, cocina, caja, bodega y administracion.
- Trabajar con datos de demostracion sin afectar informacion real.
- Evaluar decisiones tomadas por estudiantes.
- Medir food cost, mermas, rendimiento e inventario.
- Registrar evidencia de aprendizaje.
- Entregar reportes docentes y operacionales.

## 3. Diferenciacion frente a un POS comercial

| POS gastronomico tradicional | Plataforma gastronomica academica |
| --- | --- |
| Enfocado en vender y cobrar | Enfocada en ensenar, simular y operar |
| Prioriza caja, comandas y ventas | Incluye escenarios, evaluacion y trazabilidad |
| Pensado para restaurantes comerciales | Pensado para laboratorios gastronomicos |
| No suele evaluar alumnos | Permite ejercicios y resultados por fase |
| No separa practica de datos reales | Trabaja con escenarios de demostracion |
| Puede cobrar comisiones o licencias por local | Modelo fijo sin comision por venta |

El argumento principal no debe ser que la plataforma es mas barata que un POS, sino que resuelve un problema distinto: formacion gastronomica aplicada con operacion real.

## 4. Estado de madurez y transparencia

Para reducir el riesgo percibido por la universidad, se recomienda presentar la solucion como un producto en desarrollo avanzado, no como una plataforma enterprise ya consolidada.

### Ya disponible como base demostrable

- Interfaz web responsive.
- Modulos operativos principales en modo demo.
- Mesas y salon.
- Pedidos presenciales.
- Cocina tipo KDS.
- Caja.
- Productos.
- Recetario tecnico.
- Inventario y bodega.
- Compras y proveedores.
- Seguridad alimentaria.
- Reportes.
- Documentos imprimibles.
- Simulador academico inicial.
- Identidad visual UDLA aplicada.
- Modo claro y oscuro.

### Requiere desarrollo para version institucional

- Usuarios reales con autenticacion institucional.
- Roles docentes y alumnos completos.
- Permisos granulares por modulo.
- Escenarios creados o parametrizados por docentes.
- Reportes academicos por estudiante o grupo.
- Integraciones con sistemas de la universidad, si fueran requeridas.
- Pruebas formales de seguridad, carga y aceptacion.
- Manuales finales y capacitacion.
- Modulo IA, solo si se contrata el plan avanzado.

Esta transparencia ayuda a posicionar el proyecto como una implementacion controlada por etapas, no como una promesa sobredimensionada.

### Clasificacion de madurez por plan

Para evitar ambiguedad comercial, cada plan debe presentarse con una categoria de madurez distinta.

Lectura recomendada para comite:

- No venderlo como software enterprise consolidado.
- No reducirlo a un prototipo sin valor operativo.
- Presentarlo como MVP funcional con base demostrable, evolucionable a producto institucional.
- Presentar IA como roadmap avanzado, no como promesa base.

| Plan | Categoria realista | Que significa | Que no significa |
| --- | --- | --- | --- |
| Modular Restaurante | MVP funcional / piloto operativo | Version acotada, demostrable y usable para validar flujos principales | No es software enterprise ni producto institucional completo |
| Academico Personalizado | Producto institucional a medida | Version implementada con usuarios, roles, escenarios, reportes y soporte definido | No es una plataforma masiva consolidada con anos de operacion previa |
| Academico IA | Roadmap avanzado / segunda etapa | Capa de asistencia inteligente sobre una plataforma ya validada | No debe venderse como IA autonoma ni evaluador automatico definitivo |

La propuesta debe explicar claramente que el camino recomendado es comenzar con un piloto/MVP validable, convertirlo luego en producto academico institucional y dejar IA como evolucion posterior.

## 5. Arquitectura tecnica propuesta

La arquitectura recomendada para una primera etapa es moderna, modular y basada en nube.

### Stack sugerido

- Frontend: Next.js, React, TypeScript y Tailwind CSS.
- Backend y base de datos: Supabase con PostgreSQL.
- Tiempo real: Supabase Realtime para cocina y pedidos.
- Autenticacion: Supabase Auth o integracion institucional a definir.
- Hosting: Vercel o infraestructura cloud equivalente.
- Auditoria: logs de acciones relevantes por usuario y modulo.
- IA opcional: integracion controlada con proveedor LLM, por ejemplo OpenAI, solo en plan avanzado.

### Seguridad minima propuesta

- Acceso por usuario y rol.
- Politicas de permisos por modulo.
- Separacion entre datos reales y escenarios academicos.
- HTTPS.
- Variables de entorno protegidas.
- Logs de auditoria.
- Respaldos periodicos.
- Exportacion de datos ante termino de contrato.

### Integraciones institucionales

No se incluyen por defecto. Pueden evaluarse como alcance adicional:

- Moodle u otro LMS.
- LDAP / SSO institucional.
- Banner u otro sistema academico.
- Sistemas financieros o administrativos.
- Impresoras fisicas de cocina/caja.

Se recomienda incluir una etapa de levantamiento tecnico antes de comprometer integraciones.

## 6. Respuestas tecnicas para comite TI

Esta seccion responde de forma directa las preguntas que normalmente levantara un area de tecnologia antes de aprobar una plataforma institucional.

### Que stack usaremos

Para el piloto y primera version institucional se propone el siguiente stack:

| Capa | Tecnologia propuesta | Motivo |
| --- | --- | --- |
| Frontend | Next.js, React, TypeScript | Aplicacion web moderna, mantenible y escalable |
| UI | Tailwind CSS | Desarrollo rapido de interfaz responsive y consistente |
| Backend | Supabase | API, autenticacion, base de datos y tiempo real en una misma plataforma |
| Base de datos | PostgreSQL | Base relacional robusta para pedidos, recetas, inventario, compras y reportes |
| Tiempo real | Supabase Realtime | Actualizacion de comandas y cocina sin recargar pantalla |
| Hosting frontend | Vercel o cloud equivalente | Despliegue web estable, versionado y facil rollback |
| Auditoria | Logs internos en base de datos | Trazabilidad de acciones por usuario, modulo y fecha |
| IA opcional | OpenAI u otro proveedor LLM validado | Chatbot y asistencia docente solo en plan avanzado |

El stack puede ajustarse si UDLA exige infraestructura propia, proveedor cloud especifico o politicas internas distintas.

### Quien aloja la plataforma

Se proponen dos alternativas:

| Alternativa | Descripcion | Recomendada para |
| --- | --- | --- |
| Alojamiento administrado por el proveedor | El proveedor configura y administra Vercel/Supabase durante el piloto | Piloto rapido y de bajo riesgo |
| Alojamiento en cuentas institucionales UDLA | UDLA es titular de las cuentas cloud y el proveedor opera como administrador tecnico | Version institucional y continuidad a largo plazo |

Para una universidad, la opcion mas recomendable es que la version productiva quede en cuentas controladas por UDLA o bajo un contrato que garantice exportacion de datos, continuidad y termino ordenado del servicio.

### Que SLA existe

Para una empresa emergente, no conviene prometer un SLA enterprise sin infraestructura y soporte 24/7 contratados.

SLA recomendado por etapa:

| Etapa | Disponibilidad objetivo | Soporte |
| --- | ---: | --- |
| Piloto | Mejor esfuerzo controlado | Horario habil |
| Produccion base | 99,0%-99,5% mensual, excluyendo mantenimientos y caidas de terceros | Horario habil con prioridades |
| Produccion avanzada | SLA superior a definir contractualmente | Requiere costo adicional |

Los SLA con multas, soporte nocturno, turnos de emergencia o alta disponibilidad multi-region deben cotizarse como servicio adicional.

### Que seguridad tendra

La seguridad minima propuesta incluye:

- Acceso mediante usuario autenticado.
- Roles y permisos por perfil.
- Separacion entre ambiente demo, piloto y produccion.
- Politicas de acceso por tabla en base de datos.
- HTTPS obligatorio.
- Variables de entorno protegidas.
- Logs de auditoria para acciones relevantes.
- Control de permisos administrativos.
- Respaldo de datos.
- Exportacion de datos al termino del contrato.
- No registrar informacion sensible innecesaria en logs.

Para una etapa institucional, se recomienda agregar:

- Revision de seguridad por TI UDLA.
- Politicas de contrasenas o SSO institucional.
- Matriz formal de permisos.
- Pruebas de aceptacion de seguridad.
- Procedimiento de baja de usuarios.
- Acuerdo de tratamiento de datos, si aplica.

### Backups: frecuencia y retencion

Propuesta base:

| Ambiente | Frecuencia | Retencion sugerida |
| --- | --- | --- |
| Piloto | Backup logico diario | 7 dias |
| Produccion base | Backup diario + respaldo previo a despliegues relevantes | 14 a 30 dias |
| Produccion avanzada | Backup diario, exportacion mensual y prueba periodica de restauracion | 30 dias o mas, segun contrato |

La retencion final depende del plan cloud contratado y de las politicas internas de UDLA. Para produccion, se recomienda realizar una prueba de restauracion al menos una vez por semestre.

### Como se manejaran usuarios institucionales

Se propone un enfoque por etapas:

| Etapa | Manejo de usuarios |
| --- | --- |
| Piloto | Usuarios creados manualmente o por carga controlada |
| Primera version academica | Roles docente, alumno, administrador y perfiles operativos |
| Version institucional | Evaluar SSO, LDAP, Microsoft Entra ID, Moodle u otro mecanismo definido por UDLA |

Roles minimos recomendados:

- Administrador.
- Supervisor.
- Cajero.
- Mesero.
- Cocinero.
- Jefe de cocina.
- Encargado de bodega.
- Docente.
- Alumno.

Cada usuario debe tener permisos segun rol y registro de acciones relevantes en logs de auditoria.

### Se integra con Moodle, Banner o LDAP

No se debe prometer integracion automatica sin levantamiento tecnico.

Estado recomendado:

| Sistema | Estado propuesto |
| --- | --- |
| Moodle | Integracion evaluable como adicional para cursos, usuarios o resultados |
| Banner | Integracion evaluable como adicional, requiere acceso, API y validacion TI |
| LDAP / SSO | Recomendable para version institucional, sujeto a politicas UDLA |
| Microsoft Entra ID / Azure AD | Alternativa posible si UDLA lo utiliza |

Para cotizar integraciones se requiere:

- Documentacion tecnica del sistema origen.
- Tipo de autenticacion.
- Ambientes de prueba.
- Permisos de API.
- Responsable TI de UDLA.
- Alcance exacto: usuarios, cursos, notas, reportes o solo login.

### Que tecnologias IA se usaran

La IA solo se considera en el Plan Academico IA.

Tecnologia propuesta:

- Proveedor LLM: OpenAI u otro proveedor aprobado por UDLA.
- Integracion mediante API segura desde backend.
- Prompts y contexto controlados por escenario.
- Registro de interacciones relevantes para auditoria academica.
- Limites de consumo por usuario, curso o periodo.

Usos propuestos:

- Chatbot academico.
- Explicacion asistida de errores.
- Resumen de desempeno.
- Generacion asistida de escenarios.
- Analisis de reportes.
- Alertas sobre food cost, mermas, stock y seguridad alimentaria.

### Como funcionaria la IA

La IA no debe operar como un sistema libre sin control. Debe funcionar sobre informacion acotada y verificable.

Flujo propuesto:

1. El estudiante o docente realiza una consulta dentro de un modulo autorizado.
2. El sistema entrega a la IA solo el contexto necesario: escenario, fase, acciones ejecutadas, resultados y reglas pedagogicas.
3. La IA genera una respuesta asistida usando ese contexto.
4. La respuesta queda registrada como apoyo, no como decision final.
5. El docente conserva la responsabilidad de evaluacion y retroalimentacion formal.

Ejemplos:

| Funcion IA | Como opera | Dependencia de IA generativa |
| --- | --- | --- |
| Explicacion de errores | Compara accion del alumno contra reglas del escenario y genera una explicacion | Alta, requiere revision docente en casos sensibles |
| Generacion de escenarios | Propone borradores de casos a partir de parametros definidos por el docente | Alta, el docente debe aprobar antes de publicar |
| Analisis conversacional | Resume datos existentes de reportes, ventas, mermas o inventario | Media, depende de la calidad de datos disponibles |
| Recomendaciones | Sugiere acciones posibles, no decisiones obligatorias | Alta, no debe ejecutarse automaticamente |
| Resumen de desempeno | Organiza evidencias y resultados registrados por el sistema | Media, debe citar datos usados |

### Precision esperada y limitaciones

La IA no debe prometer exactitud absoluta. Su precision dependera de:

- Calidad de los datos del escenario.
- Reglas pedagogicas configuradas.
- Claridad de las acciones registradas.
- Limites del modelo IA utilizado.
- Revision y validacion docente.

Para uso academico se recomienda medir la IA con pruebas internas antes de liberarla:

- Respuestas utiles para estudiantes.
- Respuestas consistentes con la rubrica.
- Ausencia de informacion inventada relevante.
- Capacidad de citar el dato o accion que origina la respuesta.
- Tasa de respuestas rechazadas por docentes.

Si la IA no puede justificar una respuesta con datos del sistema, debe indicarlo y no inventar informacion.

### Que limites tendra el chatbot

Para evitar riesgos academicos y legales, el chatbot debe operar con limites claros:

- No reemplaza al docente.
- No califica de forma autonoma.
- No toma decisiones finales.
- No debe responder fuera del contexto de la plataforma.
- No debe exponer datos de otros estudiantes.
- No debe acceder a informacion institucional fuera del alcance autorizado.
- Debe indicar cuando una respuesta es sugerencia asistida.
- Debe respetar limites de consumo.
- Puede desactivarse por curso, usuario o modulo.

Limites comerciales sugeridos:

| Plan IA | Uso incluido sugerido | Exceso |
| --- | --- | --- |
| IA inicial | Bolsa mensual acotada de consultas | Cobro variable o bloqueo al llegar al limite |
| IA institucional | Bolsa por curso o cantidad de alumnos | Reajuste mensual segun consumo |
| IA avanzada | Analitica y generacion de escenarios | Cotizacion especifica |

## 7. Planes comerciales

### Resumen de valores

| Plan | Cliente objetivo | Implementacion neta | Implementacion con IVA aprox. | Mantencion mensual neta | Mantencion mensual con IVA aprox. |
| --- | --- | ---: | ---: | ---: | ---: |
| Modular Restaurante | Laboratorio inicial / demo operativo | 95 UF | $4.554.838 | 8 UF/mes | $383.565/mes |
| Academico Personalizado | Universidad con docentes y alumnos | 145 UF | $6.952.121 | 12 UF/mes | $575.348/mes |
| Academico IA | Simulador, automatizacion y chatbot | 225 UF | $10.787.773 | 15 UF/mes | $719.185/mes |

## 8. Plan 1 - Modular Restaurante

### Objetivo

Entregar una version funcional para operar y demostrar los principales procesos de un restaurante presencial en ambiente academico.

### Incluye

- Panel operativo.
- Mesas y salon.
- Pedidos presenciales.
- Cocina en tiempo real tipo KDS.
- Caja basica.
- Productos.
- Recetas tecnicas.
- Inventario basico.
- Compras y proveedores basicos.
- Seguridad alimentaria basica.
- Reportes iniciales.
- Documentos imprimibles.
- Simulador academico demo.

### No incluye

- Creacion avanzada de ejercicios por docentes.
- Evaluacion detallada por alumno.
- Integracion con sistemas institucionales.
- Inteligencia artificial.
- Automatizaciones avanzadas.

### Plazo estimado

6 a 8 semanas.

### Valor

- Implementacion: 95 UF netas.
- Mantencion mensual: 8 UF netas.

### Uso recomendado

Ideal como piloto funcional o primera entrada comercial para validar adopcion con docentes y estudiantes.

## 9. Plan 2 - Academico Personalizado

### Objetivo

Implementar una version academica mas completa, orientada a docentes, alumnos y evaluacion de procesos gastronomicos.

### Incluye todo el Plan 1, mas:

- Roles docente y alumno.
- Escenarios educativos personalizados.
- Ejercicios por fases.
- Evaluacion de decisiones tomadas.
- Evidencia de progreso.
- Bitacora de acciones.
- Reinicio de escenarios.
- Resultados por estudiante o grupo.
- Reportes academicos.
- Ajuste de lenguaje, flujos y casos segun asignaturas.
- Guia docente y guia de ejercicios.

### Casos educativos sugeridos

- Alta demanda en salon.
- Cocina con retraso.
- Diferencia de caja.
- Producto con alto food cost.
- Producto vencido.
- Inventario bajo.
- Merma excesiva.
- Cierre diario.

### No incluye

- Chatbot IA.
- Correccion automatica avanzada por IA.
- Integraciones institucionales no levantadas.
- Hardware POS o impresoras.

### Plazo estimado

10 a 16 semanas.

### Valor

- Implementacion: 145 UF netas.
- Mantencion mensual: 12 UF netas.

### Uso recomendado

Es el plan recomendado como propuesta principal para UDLA, porque equilibra alcance academico, costo y riesgo de implementacion.

## 10. Plan 3 - Academico IA

### Objetivo

Agregar inteligencia artificial como capa de apoyo docente y de aprendizaje, sin reemplazar la evaluacion humana.

### Incluye todo el Plan 2, mas:

- Chatbot academico controlado.
- Asistente docente para revisar avances.
- Explicacion asistida de errores.
- Resumen de desempeno por estudiante o grupo.
- Generacion asistida de escenarios.
- Analisis conversacional de reportes.
- Alertas sobre food cost, mermas, stock y seguridad alimentaria.
- Recomendaciones pedagogicas y operacionales.

### Limites de la IA

Para evitar expectativas irreales, la IA debe operar bajo estas reglas:

- No reemplaza al docente.
- No toma decisiones finales de evaluacion.
- No entrega resultados sin trazabilidad.
- Usa informacion acotada al escenario y datos disponibles.
- Puede equivocarse, por lo que sus respuestas deben considerarse asistidas.
- El consumo de IA se controla mediante limites por usuario, curso o periodo.

### Costos adicionales

El consumo de IA debe cotizarse aparte como:

- Bolsa mensual incluida.
- Tope de uso por usuario.
- Cobro variable segun consumo real.

### Plazo estimado

16 a 24 semanas.

### Valor

- Implementacion: 225 UF netas.
- Mantencion mensual: 15 UF netas.
- Consumo IA: no incluido, salvo bolsa pactada.

### Uso recomendado

Debe presentarse como evolucion futura o segunda etapa, no como primera implementacion obligatoria.

## 11. Piloto recomendado para reducir riesgo

Dado que somos una empresa emergente, se recomienda proponer una entrada mediante piloto controlado.

### Piloto 90 dias

- Alcance: Plan Modular Restaurante con base educativa inicial.
- Implementacion piloto: 60-80 UF netas.
- Mensualidad piloto: 8 UF netas.
- Duracion: 90 dias.
- Usuarios: grupo acotado de docentes y alumnos.
- Objetivo: validar utilidad, usabilidad y adopcion.

### Beneficio comercial

Si la universidad contrata el Plan Academico Personalizado dentro de los 30 dias posteriores al piloto, se puede descontar parcialmente el valor del piloto contra la implementacion final.

Esto reduce el riesgo para la universidad y permite demostrar capacidad antes de escalar.

## 12. Mitigacion de riesgo por ser empresa emergente

Para aumentar confianza ante un comite tecnico o de compras, se recomienda ofrecer condiciones de control.

### Medidas sugeridas

- Implementacion por hitos.
- Pagos contra entregables.
- Piloto previo.
- Criterios de aceptacion por modulo.
- Repositorio y documentacion tecnica disponibles para revision.
- Exportacion de datos garantizada.
- Sin permanencia extensa obligatoria en etapa piloto.
- Reuniones semanales de avance.
- Actas de validacion.
- Manuales y capacitacion incluidos.
- Opcion de traspaso o escrow de codigo, si la universidad lo exige contractualmente.

### Esquema de pagos sugerido

Para implementacion completa:

- 30% al inicio.
- 40% contra version beta validable.
- 30% contra aceptacion final.

Para piloto:

- 50% al inicio.
- 50% al cierre y entrega del informe de resultados.

Este esquema protege a ambas partes y ayuda a compensar la falta de respaldo historico de una empresa mas grande.

## 13. Evidencia de capacidad

Como empresa emergente, la confianza no debe basarse solo en trayectoria comercial, sino en evidencia verificable.

### Como responder a la pregunta "quien asegura que pueden construir esto"

La respuesta debe ser transparente: al no contar aun con una trayectoria institucional consolidada, la garantia debe venir de un proceso de ejecucion controlado, evidencia tecnica y pagos asociados a entregables verificables.

Elementos de confianza propuestos:

- Demo funcional disponible antes de la contratacion completa.
- Piloto de 90 dias antes de escalar.
- Hitos tecnicos medibles.
- Criterios de aceptacion por modulo.
- Pagos contra avance y aceptacion.
- Reuniones semanales con acta.
- Revision tecnica por TI UDLA.
- Exportacion de datos garantizada.
- Documentacion tecnica y funcional.
- Opcion de escrow o traspaso pactado de codigo si UDLA lo exige.

### Portafolio y experiencia

Si no existe portafolio institucional suficiente, no conviene ocultarlo. Se recomienda presentarlo asi:

- Proyecto en etapa de producto emergente especializado.
- Demo ya desarrollada como evidencia funcional.
- Capacidad tecnica demostrable mediante revision del producto.
- Validacion gastronomica mediante especialista o docente asesor.
- Implementacion progresiva para reducir riesgo.

Antes de entregar una propuesta formal, esta seccion debe completarse con:

- Nombre legal de la empresa.
- Sitio web o presentacion corporativa.
- Perfiles del equipo.
- Experiencias previas relevantes, aunque sean parciales.
- Referencias, si existen.
- Capturas o video de la demo.

### Evidencia que se recomienda presentar

- Demo navegable del producto.
- Video corto del flujo principal.
- Repositorio o revision tecnica controlada, si la universidad lo solicita.
- Documento de arquitectura.
- Modelo de base de datos.
- Roadmap por etapas.
- Cronograma de piloto.
- Criterios de aceptacion por modulo.
- Perfiles del equipo ejecutor.
- Bitacora de avances durante el piloto.

### Metodologia de implementacion

La metodologia debe ser incremental y validable.

| Fase | Duracion estimada | Resultado |
| --- | ---: | --- |
| Levantamiento | 1-2 semanas | Alcance, responsables, restricciones TI y criterios de aceptacion |
| Ajuste MVP | 3-6 semanas | Version piloto con flujos principales listos |
| Piloto controlado | 90 dias | Uso real con grupo acotado de docentes y alumnos |
| Evaluacion | 1-2 semanas | Informe de resultados, brechas y recomendacion de escalamiento |
| Implementacion institucional | 8-16 semanas | Roles, reportes, escenarios y capacitacion formal |
| Evolucion IA | 12-24 semanas | Solo si la plataforma base fue validada |

### Roadmap recomendado

| Etapa | Alcance | Decision esperada |
| --- | --- | --- |
| 0. Demo | Mostrar flujo actual y validar interes | Continuar o descartar |
| 1. Piloto | Probar con usuarios reales y casos acotados | Ajustar y medir adopcion |
| 2. Version academica | Docentes, alumnos, escenarios y reportes | Usar en asignaturas |
| 3. Integraciones | SSO, Moodle, Banner u otros sistemas | Cotizar segun factibilidad |
| 4. IA | Chatbot, analisis y generacion asistida | Implementar solo con reglas claras |

### Equipo minimo recomendado

| Rol | Responsabilidad |
| --- | --- |
| Lider de proyecto | Coordinacion, reuniones, alcance y entregables |
| Desarrollador full-stack | Implementacion web, base de datos, permisos y despliegue |
| Especialista gastronomico | Validacion de recetas, costos, mermas, inventario y seguridad alimentaria |
| Disenador UX/UI | Experiencia para docentes, alumnos, salon, cocina y caja |
| Soporte / QA | Pruebas, capacitacion, documentacion y seguimiento |

Antes de presentar la propuesta final, esta tabla debe completarse con nombres, experiencia, dedicacion estimada y responsable suplente.

### Criterios de aceptacion del piloto

El piloto deberia considerarse exitoso si se cumple al menos lo siguiente:

- Docentes pueden ejecutar escenarios de prueba.
- Alumnos pueden completar un flujo basico de atencion.
- Pedidos pasan correctamente desde salon a cocina.
- Caja registra apertura, cobro y cierre.
- Inventario refleja movimientos basicos.
- Recetas muestran costo, rendimiento y food cost.
- Reportes entregan indicadores basicos.
- El simulador registra progreso y evidencia.
- No existen bloqueos criticos en los flujos principales.

## 14. Soporte y niveles de servicio

La mensualidad incluye soporte y continuidad operativa, pero debe definirse con limites claros.

### Soporte base propuesto

- Canal de soporte por correo o mesa de ayuda.
- Horario habil: lunes a viernes, 09:00 a 18:00.
- Correcciones menores.
- Mantenimiento preventivo.
- Actualizaciones de seguridad.
- Respaldo y monitoreo basico.

### Tiempos de respuesta sugeridos

| Severidad | Ejemplo | Primera respuesta |
| --- | --- | ---: |
| Critica | Plataforma no disponible | 4-8 horas habiles |
| Alta | Modulo principal con error bloqueante | 1 dia habil |
| Media | Error parcial con alternativa de uso | 2-3 dias habiles |
| Baja | Ajuste menor o consulta | 5 dias habiles |

Los SLA formales, multas o soporte 24/7 deben cotizarse por separado.

## 15. Propiedad de datos y condiciones comerciales

### Datos

- Los datos academicos y operacionales pertenecen a la universidad.
- La universidad debe poder solicitar exportacion de datos.
- Los datos de estudiantes deben tratarse bajo criterios de confidencialidad.
- Los ambientes de prueba y datos reales deben mantenerse separados.

### Propiedad intelectual

Se recomienda definirlo contractualmente de una de estas formas:

1. Licencia de uso: el proveedor mantiene la propiedad del software base y la universidad recibe derecho de uso.
2. Desarrollo a medida: la universidad adquiere derechos sobre componentes desarrollados exclusivamente para ella.
3. Modelo mixto: el proveedor conserva la plataforma base y la universidad conserva datos, configuraciones y contenidos academicos propios.

Para este proyecto se recomienda el modelo mixto.

### Licenciamiento

Condicion recomendada:

- Licencia de uso mensual o anual para la plataforma base.
- Implementacion cobrada por unica vez segun plan contratado.
- Personalizaciones especificas documentadas como entregables del proyecto.
- Prohibicion de reventa o sublicenciamiento sin autorizacion.
- Derecho de uso mientras el contrato este vigente y los pagos esten al dia.

### Reajuste de mensualidad

Se recomienda definirlo por contrato:

- Mensualidad expresada en UF para mantener valor real.
- Reajuste automatico por variacion de UF.
- Revision comercial anual si aumenta el alcance, cantidad de usuarios, ambientes, soporte o consumo cloud.
- Costos de IA, integraciones o infraestructura especial cotizados aparte.

### Garantias

Garantias razonables para una empresa emergente:

- Garantia correctiva de 30 a 60 dias sobre entregables aceptados.
- Correccion sin costo de errores atribuibles al desarrollo contratado.
- Garantia de exportacion de datos al termino del contrato.
- Garantia de documentacion minima del sistema.
- Garantia de capacitacion inicial segun plan.

No se debe garantizar:

- Resultados academicos especificos.
- Cero interrupciones.
- Compatibilidad con sistemas externos no levantados.
- Funcionamiento de servicios de terceros fuera del control del proveedor.

### Multas y penalidades

Para la etapa piloto no se recomiendan multas automaticas. Se recomienda trabajar con hitos de aceptacion y pagos contra entrega.

Para una etapa institucional, las multas solo deberian aplicar si existe:

- SLA contratado formalmente.
- Alcance tecnico cerrado.
- Responsabilidades de UDLA y proveedor claramente separadas.
- Exclusiones por caidas de terceros, mantenciones o problemas de conectividad institucional.

### Dependencia del proveedor

Para reducir dependencia, se recomienda incluir:

- Documentacion tecnica.
- Exportacion de base de datos.
- Manual de despliegue o arquitectura.
- Uso de tecnologias estandar: Next.js, PostgreSQL, Supabase.
- Repositorio privado con acceso controlado si se acuerda.
- Opcion de escrow o traspaso de codigo bajo condiciones contractuales.

### Termino de contrato

Al finalizar el contrato, deberia garantizarse:

- Exportacion de datos.
- Entrega de respaldos acordados.
- Periodo de continuidad de 30 a 60 dias.
- Eliminacion o anonimizado de datos, si corresponde.

### Clausulas de termino recomendadas

- Termino anticipado con aviso de 30 a 60 dias.
- Pago de hitos efectivamente entregados y aceptados.
- Entrega de datos en formato exportable.
- Desactivacion ordenada de usuarios y accesos.
- Eliminacion, anonimizado o devolucion de datos segun contrato.
- Continuidad temporal pagada si UDLA necesita migrar a otro proveedor.

## 16. Lo que no debe prometerse en primera etapa

Para mantener credibilidad, se recomienda evitar promesas demasiado amplias antes del piloto.

No prometer como incluido sin levantamiento:

- Integracion automatica con todos los sistemas UDLA.
- IA que evalua autonomamente alumnos.
- Alta disponibilidad enterprise.
- Soporte 24/7.
- Escalamiento ilimitado.
- Funcionamiento offline completo.
- Compatibilidad inmediata con cualquier impresora.
- Personalizacion ilimitada.

Estos puntos pueden considerarse en etapas posteriores o como adicionales.

## 17. Comparacion comercial frente a Justo, Gour-net u otros POS

La estrategia recomendada no es competir como POS barato.

### Donde ellos son fuertes

- Operacion comercial.
- Venta online.
- Delivery.
- POS probado en restaurantes.
- Madurez de mercado.

### Donde esta propuesta puede ser mas fuerte

- Simulacion academica.
- Ejercicios por fase.
- Evaluacion docente.
- Practica con datos demo.
- Costeo pedagogico.
- Mermas y rendimiento.
- Seguridad alimentaria.
- Reportes para aprendizaje.
- Adaptacion curricular.
- Sin comision por venta.

Mensaje recomendado:

> Para operar un restaurante comercial, existen POS consolidados. Para formar estudiantes en gestion gastronomica real, se requiere una plataforma academica especializada. Esa es la oportunidad que cubre esta propuesta.

## 18. Ruta recomendada para UDLA

### Opcion sugerida

1. Ejecutar piloto de 90 dias.
2. Medir uso con docentes y alumnos.
3. Ajustar flujos criticos.
4. Pasar al Plan Academico Personalizado.
5. Evaluar IA como segunda etapa.

### Por que esta ruta es conveniente

- Reduce riesgo inicial.
- Permite validar con usuarios reales.
- Evita comprometer de inmediato el plan mas caro.
- Da evidencia para justificar presupuesto.
- Permite ajustar el producto antes de escalar.

## 19. Indicadores de exito del piloto

Se recomienda medir el piloto con indicadores simples:

- Cantidad de docentes participantes.
- Cantidad de alumnos participantes.
- Numero de simulaciones completadas.
- Tiempo promedio por ejercicio.
- Porcentaje de ejercicios finalizados.
- Modulos mas utilizados.
- Errores o bloqueos detectados.
- Satisfaccion de usuarios.
- Ajustes solicitados por docentes.
- Viabilidad para uso semestral.

Estos indicadores ayudan a transformar el piloto en una decision de compra informada.

## 20. Proxima etapa sugerida

Para avanzar comercialmente, se recomienda preparar:

- Demo navegable.
- Documento ejecutivo de 8-12 paginas.
- Presentacion comercial de 10-12 slides.
- Roadmap por etapas.
- Matriz de modulos incluidos y no incluidos.
- Criterios de aceptacion del piloto.
- Cronograma de 90 dias.
- Perfil del equipo ejecutor.

## 21. Mensaje final sugerido

> Proponemos implementar una plataforma gastronomica academica que permita a UDLA simular la operacion real de un restaurante presencial, entrenar estudiantes en procesos de salon, cocina, caja, inventario, costeo y seguridad alimentaria, y entregar a los docentes herramientas de seguimiento, evaluacion y mejora continua. Dado que somos una empresa emergente, proponemos iniciar con un piloto controlado, medible y descontable de una futura implementacion, reduciendo el riesgo institucional y validando la solucion con usuarios reales antes de escalar.

## 22. Fuentes y referencias

- Servicio de Impuestos Internos, valores UF 2026: https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
- Servicio de Impuestos Internos, tasa IVA 19%: https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_0572.htm
- GetJusto, planes publicos de referencia: https://www.getjusto.com/planes
- Gour-net, referencia de plataforma gastronomica: https://gour-net.cl/index.html
