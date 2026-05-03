# ═══════════════════════════════════════════════════════════
# 🤖 HOUSET — n8n WORKFLOWS (God Mode MCP Nativo)
# Importar en n8n v2.14+ via: Settings → Import Workflow
# ═══════════════════════════════════════════════════════════

## WORKFLOW A: Artesano Aprobado
## Trigger: Supabase row insert en artisan_partners
## ─────────────────────────────────────────────
## Nodos:
##   1. Supabase Trigger → escucha INSERT en artisan_partners
##   2. IF → status = 'pending'
##   3. Resend Node → email bienvenida al artesano
##   4. Gmail/Resend → notificación WhatsApp al Comandante
##   5. Supabase Update → status = 'notified'
##
## JSON de configuración básica:
{
  "name": "Houset - Artesano B2B Aprobado",
  "nodes": [
    {
      "type": "n8n-nodes-base.supabaseTrigger",
      "parameters": {
        "table": "artisan_partners",
        "event": "INSERT"
      }
    },
    {
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [{ "value1": "={{$json.status}}", "operation": "equal", "value2": "pending" }]
        }
      }
    },
    {
      "type": "n8n-nodes-base.resend",
      "parameters": {
        "to": "={{$json.email}}",
        "subject": "Bienvenue dans le réseau HomeSetup Luxembourg!",
        "text": "Votre demande de partenariat a bien été reçue. Notre équipe vous contactera sous 24h."
      }
    }
  ]
}

## ─────────────────────────────────────────────
## WORKFLOW B: Lead Calificado
## Trigger: Supabase INSERT en contact_leads
## ─────────────────────────────────────────────
## Nodos:
##   1. Supabase Trigger → escucha INSERT en contact_leads
##   2. Switch → según service type
##      - 'consulting' → email inmediato de alta prioridad
##      - 'materials'  → enviar catálogo PDF adjunto
##      - 'craftsmen'  → redirigir a coordinador
##   3. Resend → email al Comandante con datos del lead
##   4. Supabase Update → status = 'contacted'
##
## Configuración:
{
  "name": "Houset - Lead Calificado",
  "nodes": [
    {
      "type": "n8n-nodes-base.supabaseTrigger",
      "parameters": { "table": "contact_leads", "event": "INSERT" }
    },
    {
      "type": "n8n-nodes-base.switch",
      "parameters": {
        "value": "={{$json.service}}",
        "rules": [
          { "value": "consulting", "output": 0 },
          { "value": "materials",  "output": 1 },
          { "value": "craftsmen",  "output": 2 }
        ]
      }
    },
    {
      "type": "n8n-nodes-base.resend",
      "parameters": {
        "to": "yucolaguilar@gmail.com",
        "subject": "🔥 LEAD PRIORITAIRE: ={{$json.name}}",
        "html": "<h2>Nouveau lead</h2><p>{{$json.name}} — {{$json.email}}</p><p>Service: {{$json.service}}</p>"
      }
    }
  ]
}

## ─────────────────────────────────────────────
## WORKFLOW C: Sync Catálogo 24h
## Trigger: Schedule (00:00 Europe/Luxembourg)
## ─────────────────────────────────────────────
## Nodos:
##   1. Schedule Trigger → cron 0 0 * * * (medianoche LUX)
##   2. HTTP Request → BigBuy API /catalog?country=LU
##   3. Function → normalizar datos al schema Houset
##   4. Supabase Upsert → tabla products (onConflict: id)
##   5. HTTP Request → POST /api/revalidate (purgar cache)
##   6. Send Email → resumen de sync al Comandante
##
{
  "name": "Houset - Sync Catálogo 24h",
  "nodes": [
    {
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": { "rule": { "cronExpression": "0 0 * * *" } }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.bigbuy.eu/rest/catalog/products.json",
        "authentication": "headerAuth",
        "headerParameters": {
          "parameters": [{ "name": "Authorization", "value": "Bearer {{$env.BIGBUY_API_KEY}}" }]
        }
      }
    },
    {
      "type": "n8n-nodes-base.supabase",
      "parameters": {
        "operation": "upsert",
        "table": "products",
        "fieldsUi": { "fieldValues": [] }
      }
    }
  ]
}

## ═══════════════════════════════════════════════════════════
## SETUP n8n MCP (para que Claude/Cursor controlen los workflows)
## ═══════════════════════════════════════════════════════════
##
## 1. En n8n Settings → MCP → Enable
## 2. Copiar connection URL + Bearer token
## 3. Añadir a Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json):
##
## {
##   "mcpServers": {
##     "n8n-houset": {
##       "url": "https://tu-n8n.domain.com/mcp",
##       "headers": { "Authorization": "Bearer TU_TOKEN" }
##     }
##   }
## }
##
## 4. Reiniciar Claude Desktop
## 5. Claude puede ahora ejecutar/crear/editar workflows Houset directamente
