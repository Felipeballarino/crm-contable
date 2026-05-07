import { NextRequest, NextResponse } from "next/server";

/**
 * Mock AFIP Padrón endpoint — SOLO PARA DESARROLLO/PRUEBAS
 *
 * Simula la respuesta de AFIP para distintos CUITs de prueba.
 * Usá este endpoint configurando en tu .env.local:
 *   AFIP_PADRON_URL=http://localhost:3000/api/mock/afip/{cuit}
 */

const MOCK_DATA: Record<string, any> = {
  "20301234567": {
    nombre: "GARCIA JUAN CARLOS",
    tipoPersona: "FISICA",
    estadoClave: "ACTIVO",
    domicilioFiscal: {
      direccion: "AV. CORRIENTES 1234 PISO 5",
      localidad: "CABA",
      provincia: "CAPITAL FEDERAL",
      codigoPostal: "1043",
    },
    actividadPrincipal: {
      descripcion: "SERVICIOS DE CONTABILIDAD Y AUDITORIA",
    },
    impuestos: [
      { descripcion: "RESPONSABLE INSCRIPTO", periodo: "2020-01-01" },
      { descripcion: "IMPUESTO A LAS GANANCIAS", periodo: "2020-01-01" },
    ],
    inicioActividades: "2020-03-15",
  },
  "30712345678": {
    nombre: "TECH SOLUTIONS S.R.L.",
    tipoPersona: "JURIDICA",
    estadoClave: "ACTIVO",
    domicilioFiscal: {
      direccion: "AV. SANTA FE 890",
      localidad: "CABA",
      provincia: "CAPITAL FEDERAL",
      codigoPostal: "1059",
    },
    actividadPrincipal: {
      descripcion: "DESARROLLO DE SOFTWARE",
    },
    impuestos: [
      { descripcion: "RESPONSABLE INSCRIPTO", periodo: "2019-06-01" },
      { descripcion: "IMPUESTO A LAS GANANCIAS", periodo: "2019-06-01" },
    ],
    inicioActividades: "2019-06-01",
  },
  "20987654321": {
    nombre: "LOPEZ MARIA ELENA",
    tipoPersona: "FISICA",
    estadoClave: "ACTIVO",
    domicilioFiscal: {
      direccion: "CALLE BELGRANO 567",
      localidad: "CORDOBA",
      provincia: "CORDOBA",
      codigoPostal: "5000",
    },
    actividadPrincipal: {
      descripcion: "COMERCIO MINORISTA DE ALIMENTOS",
    },
    impuestos: [
      { descripcion: "MONOTRIBUTO", periodo: "2021-01-01" },
    ],
    inicioActividades: "2021-01-10",
  },
  "30698765432": {
    nombre: "DISTRIBUIDORA DEL SUR S.A.",
    tipoPersona: "JURIDICA",
    estadoClave: "ACTIVO",
    domicilioFiscal: {
      direccion: "RUTA 2 KM 45.5",
      localidad: "LA PLATA",
      provincia: "BUENOS AIRES",
      codigoPostal: "1900",
    },
    actividadPrincipal: {
      descripcion: "COMERCIO MAYORISTA DE BEBIDAS",
    },
    impuestos: [
      { descripcion: "RESPONSABLE INSCRIPTO", periodo: "2018-03-01" },
      { descripcion: "IMPUESTO A LAS GANANCIAS", periodo: "2018-03-01" },
      { descripcion: "IVA", periodo: "2018-03-01" },
    ],
    inicioActividades: "2018-03-01",
  },
  "20112233445": {
    nombre: "MARTINEZ ROBERTO CARLOS",
    tipoPersona: "FISICA",
    estadoClave: "ACTIVO",
    domicilioFiscal: {
      direccion: "AV. LIBERTADOR 3456 DEPTO 8B",
      localidad: "VICENTE LOPEZ",
      provincia: "BUENOS AIRES",
      codigoPostal: "1638",
    },
    actividadPrincipal: {
      descripcion: "SERVICIOS JURIDICOS",
    },
    impuestos: [
      { descripcion: "EXENTO", periodo: "2022-01-01" },
    ],
    inicioActividades: "2022-05-20",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cuit: string }> }
) {
  const { cuit } = await params;
  const cleanCuit = cuit.replace(/\D/g, "");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const data = MOCK_DATA[cleanCuit];

  if (!data) {
    // Return a generic response for any other CUIT
    const isFisica = cleanCuit.startsWith("20") || cleanCuit.startsWith("27");
    return NextResponse.json({
      nombre: isFisica ? "PERSONA FISICA DE PRUEBA" : "EMPRESA DE PRUEBA S.A.S.",
      tipoPersona: isFisica ? "FISICA" : "JURIDICA",
      estadoClave: "ACTIVO",
      domicilioFiscal: {
        direccion: "CALLE FICTICIA 999",
        localidad: "CABA",
        provincia: "CAPITAL FEDERAL",
        codigoPostal: "1000",
      },
      actividadPrincipal: {
        descripcion: "ACTIVIDAD DE PRUEBA",
      },
      impuestos: [
        { descripcion: "RESPONSABLE INSCRIPTO", periodo: "2024-01-01" },
      ],
      inicioActividades: "2024-01-15",
    });
  }

  return NextResponse.json(data);
}
