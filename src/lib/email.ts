import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Expiration = {
  tipo: string;
  descripcion: string | null;
  fechaVencimiento: Date;
  client: { razonSocial: string };
};

export async function sendExpirationAlert({
  to,
  studioName,
  expirations,
}: {
  to: string;
  studioName: string;
  expirations: Expiration[];
}) {
  const rows = expirations
    .map((exp) => {
      const fecha = new Date(exp.fechaVencimiento).toLocaleDateString("es-AR");
      const desc = exp.descripcion ? ` — ${exp.descripcion}` : "";
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${exp.client.razonSocial}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#475569;">${exp.tipo}${desc}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#dc2626;font-weight:600;">${fecha}</td>
        </tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:#4f46e5;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;">📅 Alerta de vencimientos</h1>
          <p style="margin:4px 0 0;color:#c7d2fe;font-size:14px;">${studioName}</p>
        </div>
        <div style="padding:24px 32px;">
          <p style="color:#475569;font-size:14px;margin-top:0;">
            Los siguientes vencimientos se aproximan en los próximos días:
          </p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Cliente</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Tipo</th>
                <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Fecha</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#94a3b8;font-size:12px;margin-bottom:0;margin-top:24px;">
            Este email fue enviado automáticamente por CRM Contable.
          </p>
        </div>
      </div>
    </body>
    </html>`;

  return resend.emails.send({
    from: "CRM Contable <onboarding@resend.dev>",
    to,
    subject: `⚠️ ${expirations.length} vencimiento${expirations.length !== 1 ? "s" : ""} próximo${expirations.length !== 1 ? "s" : ""} — ${studioName}`,
    html,
  });
}
