# Estimador de acero para columnas

Aplicación web progresiva para estimar acero longitudinal y estribos de columnas. El cálculo principal tiene pruebas automatizadas y GitHub Actions ejecuta la verificación de sintaxis, las pruebas con cobertura y la publicación de los archivos de la PWA como artefacto.

## Ejecutar el pipeline

1. Realiza un cambio y confirma los archivos:

	```sh
	git add .
	git commit -m "Analisis de métricas"
	git push
	```

2. En GitHub, abre **Actions** y selecciona la ejecución más reciente del workflow **CI**.
3. Registra el estado del job, las pruebas y cobertura mostradas en el paso de pruebas, el tiempo total de la ejecución y el artefacto `pwa-estimador-acero`.
4. Descarga una captura del dashboard y adjúntala a la entrega.

Para reproducir localmente: `npm run build` y `npm test` (Node.js 22).

## Tabla de métricas

Completar con los datos de la ejecución de GitHub Actions; no usar estimaciones.

| Métrica | Valor encontrado |
| --- | --- |
| Build exitoso | Pendiente de ejecutar Actions |
| Número de pruebas | Pendiente de ejecutar Actions |
| Cobertura (%) | Pendiente de ejecutar Actions |
| Tiempo de ejecución | Pendiente de ejecutar Actions |
| Artefactos generados | Pendiente de ejecutar Actions |

## Reporte de ejecución CI

| Campo | Resultado |
| --- | --- |
| Proyecto | Estimador de acero para columnas |
| Fecha | Completar con la fecha de ejecución |
| Pipeline ejecutado | CI: verificación de sintaxis, pruebas y artefacto de PWA |
| Build Success Rate | Completar después de la ejecución |
| Total de pruebas | Completar después de la ejecución |
| Cobertura | Completar después de la ejecución |
| Tiempo total | Completar después de la ejecución |
| Bugs encontrados | Registrar fallos detectados; indicar 0 si no hubo |

### Análisis

1. **¿El pipeline fue exitoso?** Indicar el estado del job `validate` y adjuntar la captura.
2. **¿Qué pruebas fueron ejecutadas?** Pruebas unitarias del cálculo de materiales con valores iniciales y redondeo de piezas; además, comprobación de sintaxis de JavaScript.
3. **¿La cobertura es suficiente?** Evaluarla frente a las fórmulas y reglas del cálculo que son críticas; la cobertura no demuestra por sí sola que todos los requisitos estén bien probados.
4. **¿Qué mejora podría implementarse?** Añadir pruebas de límites y entradas inválidas, y automatizar pruebas de interacción en navegador.

## Comparación entre equipos

| Equipo | Cobertura | Tiempo | Número de pruebas | Problemas encontrados |
| --- | --- | --- | --- | --- |
| A |  |  |  |  |
| B |  |  |  |  |
| C |  |  |  |  |
| D |  |  |  |  |

## Interpretación de incidentes

- **Caso A: éxito del build 100%, cobertura 20%.** El pipeline pasa, pero solo una parte pequeña del código está cubierta. No basta para concluir que el proyecto sea de calidad; hace falta evaluar riesgos, casos críticos y calidad de las pruebas.
- **Caso B: cobertura 95%, 15 bugs detectados.** La cobertura mide código ejecutado, no la corrección de sus resultados. Las pruebas pueden revelar muchos defectos y aun así dejar casos sin verificar o tener aserciones insuficientes.
- **Caso C: éxito del build 50%.** No es confiable como señal de entrega estable: la mitad de las ejecuciones falla. Hay que investigar la causa de los fallos, distinguir defectos de código de problemas de entorno y estabilizar el pipeline.

## Entrega por equipo

- Captura del dashboard de GitHub Actions.
- Tabla de métricas completada con datos de Actions.
- Reporte técnico y análisis de resultados.
- Conclusiones individuales sobre confiabilidad, cobertura y mejoras propuestas.

| Integrante | Conclusión individual |
| --- | --- |
|  |  |
|  |  |
|  |  |