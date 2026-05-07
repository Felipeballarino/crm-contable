/**
 * AFIP Padrón Lookup
 *
 * Consulta los datos de un CUIT usando el servicio de AFIP.
 * El servicio se configura mediante la variable de entorno AFIP_PADRON_URL.
 *
 * Formato de la URL: debe contener {cuit} que se reemplaza por el CUIT a consultar.
 * Ejemplo: https://mi-servicio.com/api/persona/{cuit}
 *
 * El servicio debe devolver un JSON con esta estructura:
 * {
 *   "nombre": "RAZON SOCIAL SA",
 *   "tipoClave": "CUIT",
 *   "tipoPersona": "JURIDICA",
 *   "estadoClave": "ACTIVO",
 *   "domicilioFiscal": { "direccion": "CALLE 123", "localidad": "CABA" },
 *   "actividadPrincipal": { "descripcion": "ACTIVIDAD" },
 *   "impuestos": [{ "descripcion": "RESPONSABLE INSCRIPTO", "periodo": "2024-01-01" }],
 *   "inicioActividades": "2020-01-15"
 * }
 *
 * Servicios recomendados:
 * - AFIP SOAP oficial (requiere certificados digitales)
 * - Servicios de terceros como apicom.ar, datos.gob.ar, etc.
 */

export interface AfipPersonaData {
  nombre: string;
  tipoPersona: string;
  estadoClave: string;
  domicilioFiscal?: {
    direccion?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
  actividadPrincipal?: {
    descripcion: string;
  };
  impuestos?: Array<{
    descripcion: string;
    periodo?: string;
  }>;
  inicioActividades?: string;
}

export interface AfipLookupResult {
  razonSocial: string;
  condicionIva: string | null;
  actividadPrincipal: string | null;
  inicioActividad: string | null;
  domicilio: string | null;
  tipoSocietario: string | null;
  error?: string;
}

const PADRON_URL = process.env.AFIP_PADRON_URL;

// Mock data for development/testing — used when PADRON_URL points to localhost
const MOCK_DATA: Record<string, AfipPersonaData> = {
  "20301234567": {
    nombre: "GARCIA JUAN CARLOS",
    tipoPersona: "FISICA",
    estadoClave: "ACTIVO",
    domicilioFiscal: {
      direccion: "AV. CORRIENTES 1234 PISO 5",
      localidad: "CABA",
      provincia: "CAPITAL FEDERAL",
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
    },
    actividadPrincipal: {
      descripcion: "DESARROLLO DE SOFTWARE",
    },
    impuestos: [
      { descripcion: "RESPONSABLE INSCRIPTO", periodo: "2019-06-01" },
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
    },
    actividadPrincipal: {
      descripcion: "COMERCIO MAYORISTA DE BEBIDAS",
    },
    impuestos: [
      { descripcion: "RESPONSABLE INSCRIPTO", periodo: "2018-03-01" },
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

function parseAfipData(data: AfipPersonaData): AfipLookupResult {
  let condicionIva: string | null = null;
  if (data.impuestos && data.impuestos.length > 0) {
    const ivaImpuestos = data.impuestos.filter((imp) => {
      const desc = imp.descripcion.toUpperCase();
      return (
        desc.includes("RESPONSABLE INSCRIPTO") ||
        desc.includes("MONOTRIBUTO") ||
        desc.includes("EXENTO") ||
        desc.includes("NO RESPONSABLE") ||
        desc.includes("CONSUMIDOR FINAL")
      );
    });

    if (ivaImpuestos.length > 0) {
      const desc = ivaImpuestos[0].descripcion;
      if (desc.toUpperCase().includes("RESPONSABLE INSCRIPTO")) {
        condicionIva = "Responsable Inscripto";
      } else if (desc.toUpperCase().includes("MONOTRIBUTO")) {
        condicionIva = "Monotributista";
      } else if (desc.toUpperCase().includes("EXENTO")) {
        condicionIva = "Exento";
      } else if (desc.toUpperCase().includes("NO RESPONSABLE")) {
        condicionIva = "No Responsable";
      } else if (desc.toUpperCase().includes("CONSUMIDOR FINAL")) {
        condicionIva = "Consumidor Final";
      } else {
        condicionIva = desc;
      }
    }
  }

  let tipoSocietario: string | null = null;
  if (data.tipoPersona === "JURIDICA") {
    const nombre = data.nombre.toUpperCase();
    if (nombre.includes("S.A.")) tipoSocietario = "S.A.";
    else if (nombre.includes("S.R.L.")) tipoSocietario = "S.R.L.";
    else if (nombre.includes("S.A.S.")) tipoSocietario = "S.A.S.";
    else if (nombre.includes("COOP.")) tipoSocietario = "Cooperativa";
    else if (nombre.includes("FUNDACION")) tipoSocietario = "Fundación";
    else if (nombre.includes("ASOCIACION")) tipoSocietario = "Asociación";
    else tipoSocietario = "Otro";
  }

  let domicilio: string | null = null;
  if (data.domicilioFiscal) {
    const parts = [
      data.domicilioFiscal.direccion,
      data.domicilioFiscal.localidad,
      data.domicilioFiscal.provincia,
    ].filter(Boolean);
    if (parts.length > 0) {
      domicilio = parts.join(", ");
    }
  }

  return {
    razonSocial: data.nombre || "",
    condicionIva,
    actividadPrincipal: data.actividadPrincipal?.descripcion ?? null,
    inicioActividad: data.inicioActividades ?? null,
    domicilio,
    tipoSocietario,
  };
}

export async function lookupCuit(cuit: string): Promise<AfipLookupResult> {
  if (!PADRON_URL) {
    return {
      razonSocial: "",
      condicionIva: null,
      actividadPrincipal: null,
      inicioActividad: null,
      domicilio: null,
      tipoSocietario: null,
      error: "El servicio de consulta de AFIP no está configurado. Contactá al administrador.",
    };
  }

  // If using mock endpoint, return mock data directly
  if (PADRON_URL.includes("localhost") || PADRON_URL.includes("mock")) {
    const mockData = MOCK_DATA[cuit];
    if (mockData) {
      return parseAfipData(mockData);
    }
    // Generic fallback for unknown CUITs
    const isFisica = cuit.startsWith("20") || cuit.startsWith("27");
    return parseAfipData({
      nombre: isFisica ? "PERSONA FISICA DE PRUEBA" : "EMPRESA DE PRUEBA S.A.S.",
      tipoPersona: isFisica ? "FISICA" : "JURIDICA",
      estadoClave: "ACTIVO",
      domicilioFiscal: {
        direccion: "CALLE FICTICIA 999",
        localidad: "CABA",
        provincia: "CAPITAL FEDERAL",
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

  const url = PADRON_URL.replace("{cuit}", cuit);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(process.env.AFIP_PADRON_TOKEN
          ? { Authorization: `Bearer ${process.env.AFIP_PADRON_TOKEN}` }
          : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          razonSocial: "",
          condicionIva: null,
          actividadPrincipal: null,
          inicioActividad: null,
          domicilio: null,
          tipoSocietario: null,
          error: "CUIT no encontrado en el padrón de AFIP.",
        };
      }
      return {
        razonSocial: "",
        condicionIva: null,
        actividadPrincipal: null,
        inicioActividad: null,
        domicilio: null,
        tipoSocietario: null,
        error: "Error al consultar AFIP. Intentá de nuevo más tarde.",
      };
    }

    const data: AfipPersonaData = await response.json();
    return parseAfipData(data);
  } catch {
    return {
      razonSocial: "",
      condicionIva: null,
      actividadPrincipal: null,
      inicioActividad: null,
      domicilio: null,
      tipoSocietario: null,
      error: "Error de conexión al consultar AFIP. Verificá tu conexión a internet.",
    };
  }
}
