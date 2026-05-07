# Configuración de Cron Jobs

El CRM tiene dos endpoints de automatización que pueden ser llamados por un servicio de cron:

## Endpoints

### 1. Enviar alertas de vencimientos
```
POST /api/cron/send-alerts
```
Envía emails de recordatorio a todos los estudios que tengan `alertEmail` configurado.
Marca los vencimientos como `alertSent: true` para no enviar duplicados.

### 2. Generar vencimientos recurrentes del mes
```
POST /api/cron/generate-recurring
```
Genera los vencimientos del mes actual para todas las plantillas recurrentes activas.
Saltea los que ya existen (no duplica).

## Autenticación

Ambos endpoints requieren un header `Authorization: Bearer <CRON_SECRET>` si la variable `CRON_SECRET` está configurada en el `.env`.

## Fallback automático

Si no configurás un cron externo, la automatización se ejecuta automáticamente cada vez que alguien entra al Dashboard o a Vencimientos. Esto cubre:
- Marcar vencimientos pasados como "vencidos"
- Enviar alertas de vencimientos próximos
- Generar vencimientos recurrentes del mes actual

## Configuración recomendada

### Vercel Cron (gratis)

Agregar al `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-alerts",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/generate-recurring",
      "schedule": "0 6 1 * *"
    }
  ]
}
```

- Alertas: todos los días a las 8:00 AM
- Recurrentes: día 1 de cada mes a las 6:00 AM

Configurar `CRON_SECRET` en las variables de entorno de Vercel.

### GitHub Actions

Crear `.github/workflows/cron.yml`:

```yaml
name: CRM Cron Jobs

on:
  schedule:
    - cron: "0 8 * * *"   # Alertas diarias
    - cron: "0 6 1 * *"   # Recurrentes mensuales

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Send alerts
        run: |
          curl -X POST https://tu-dominio.com/api/cron/send-alerts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
      - name: Generate recurring
        if: github.event.schedule == '0 6 1 * *'
        run: |
          curl -X POST https://tu-dominio.com/api/cron/generate-recurring \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Cron en servidor propio (Linux)

Agregar al crontab (`crontab -e`):

```bash
# Alertas diarias a las 8:00
0 8 * * * curl -X POST http://localhost:3000/api/cron/send-alerts -H "Authorization: Bearer TU_CLAVE_SECRETA"

# Recurrentes día 1 de cada mes a las 6:00
0 6 1 * * curl -X POST http://localhost:3000/api/cron/generate-recurring -H "Authorization: Bearer TU_CLAVE_SECRETA"
```
