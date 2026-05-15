# Skill: Despliegue de Houset Backend en Cloud Run

Este skill automatiza el proceso de despliegue del backend de Houset hacia Google Cloud Run en la región `europe-west1`.

## Contexto del Proyecto
- **Directorio:** `backend/`
- **Proyecto GCP:** `project-d65a68a8-d7f8-4e30-a92` (o el que esté activo).
- **Servicio Cloud Run:** `houset-backend`
- **Región:** `europe-west1`

## Pasos de Ejecución Automática (Fire-and-Forget)

1. **Navegar al directorio:**
   ```bash
   cd backend/
   ```

2. **Desplegar desde el código fuente (Source Deploy):**
   ```bash
   gcloud run deploy houset-backend \
     --source . \
     --region europe-west1 \
     --allow-unauthenticated \
     --project project-d65a68a8-d7f8-4e30-a92
   ```

3. **Verificación:**
   - Comprobar que el endpoint `/api/health` devuelve `status: ok` y `firebase: connected`.

## Reglas de Comportamiento
- No pedir confirmación antes de ejecutar comandos si la orden del usuario fue explícita ("despliega houset").
- Manejar automáticamente errores de permisos de Artifact Registry si ocurren.
- Reportar únicamente la URL final de producción al terminar.
