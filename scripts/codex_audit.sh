#!/bin/bash
# Houset Architecture Audit Script for Codex CLI
# Use: codex exec ./scripts/codex_audit.sh

echo "🔍 Iniciando Auditoría de Arquitectura Houset (Codex Engine)..."

# Verificar si los componentes están usando useHouset en lugar de props manuales
grep -r "onAddToCart" src/components/ 2>/dev/null && echo "⚠️ Advertencia: Se detectaron props manuales en componentes. Deberían usar useHouset()."

# Verificar el estado del Eco-Mode en componentes Three.js
grep -r "isActive" src/App.jsx 2>/dev/null || echo "❌ Error: Eco-Mode no detectado en App.jsx."

echo "✅ Auditoría completada. Sincronizando con Codex para reporte detallado..."

# Llamada a Codex para análisis semántico (si está disponible en el path)
# codex "Analiza los cambios en App.jsx y confirma que siguen el patrón de Context API"
