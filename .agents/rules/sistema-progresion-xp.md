---
trigger: always_on
---

# INSTRUCCIONES - CREACIÓN DE ARCHIVO DE REGLAS

## OBJETIVO
Generar un archivo de reglas en formato Markdown que defina el sistema de progresión de niveles basado en puntos (XP) para el juego. Este archivo será utilizado como referencia central dentro del sistema de agentes.

## NOMBRE DEL ARCHIVO
sistema-progresion-xp.md

## UBICACIÓN
Crear el archivo dentro del directorio:
rules/

## ESTRUCTURA DEL DOCUMENTO

El archivo debe incluir las siguientes secciones claramente definidas:

---

# SISTEMA DE PROGRESIÓN DE XP

## 1. DESCRIPCIÓN GENERAL
Explicar que el sistema parte desde nivel 0 con 0 puntos acumulados.
Indicar que el nivel 1 se alcanza al llegar a 600 puntos.
Aclarar que el sistema utiliza XP acumulativo (no incremental por nivel).

---

## 2. REGLAS DEL SISTEMA
- El nivel máximo es 30.
- El objetivo final del sistema es alcanzar 350.000 puntos.
- Todos los valores de puntos deben ser múltiplos de 100.
- La progresión debe ser creciente (cada nivel requiere más XP que el anterior).
- No se permiten valores irregulares (ejemplo: 1625).
- El nivel se incrementa únicamente cuando se alcanza o supera el umbral de puntos definido.

---

## 3. FÓRMULA BASE
Definir la fórmula matemática utilizada para calcular la progresión:

XP(nivel) ≈ redondear_a_100(600 + (nivel^2 * 230))

Especificar que:
- Se aplica redondeo a la centena más cercana.
- El nivel 30 es un caso especial ajustado manualmente a 350.000 puntos.

---

## 4. TABLA DE PROGRESIÓN
Incluir la tabla completa de niveles del 1 al 30 con sus respectivos puntos acumulados:

Nivel 1 → 600  
Nivel 2 → 1.300  
Nivel 3 → 2.100  
Nivel 4 → 3.100  
Nivel 5 → 4.400  
Nivel 6 → 6.000  
Nivel 7 → 7.900  
Nivel 8 → 10.100  
Nivel 9 → 12.700  
Nivel 10 → 15.700  
Nivel 11 → 19.100  
Nivel 12 → 23.000  
Nivel 13 → 27.400  
Nivel 14 → 32.400  
Nivel 15 → 38.000  
Nivel 16 → 44.200  
Nivel 17 → 51.100  
Nivel 18 → 58.700  
Nivel 19 → 67.100  
Nivel 20 → 76.300  
Nivel 21 → 86.400  
Nivel 22 → 97.400  
Nivel 23 → 109.400  
Nivel 24 → 122.500  
Nivel 25 → 136.700  
Nivel 26 → 152.100  
Nivel 27 → 168.800  
Nivel 28 → 186.900  
Nivel 29 → 206.500  
Nivel 30 → 350.000  

---

## 5. COMPORTAMIENTO DEL SISTEMA
- El sistema debe ser determinista.
- No se permite variación dinámica de la fórmula en runtime.
- El cálculo de nivel debe basarse exclusivamente en el XP acumulado.
- La tabla tiene prioridad sobre la fórmula en caso de discrepancia.

---

## 6. PROPÓSITO
Definir que este sistema está diseñado para:
- Controlar el pacing del juego.
- Generar sensación de progresión creciente.
- Establecer un objetivo final claro (350.000 puntos).

---

## RESTRICCIONES FINALES
- No modificar los valores una vez definidos.
- No introducir lógica adicional fuera de este sistema.
- Este archivo actúa como fuente única de verdad para la progresión de niveles.
