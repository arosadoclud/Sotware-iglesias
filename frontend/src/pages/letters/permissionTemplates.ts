// Adapted from the church's supplied permission letters. No official names or dates are fixed.
export const PERMISSION_DEFAULTS = {
  entidad_permiso: '',
  direccion_destinatario: '',
  anos_servicio: '',
  espacio_solicitado: '',
  finalidad_actividad: '',
  lugar_emision: '',
  modalidad_policial: 'local',
  nombre_autoridad: '',
  rango_autoridad: '',
  cargo_autoridad: '',
  nombre_via: '',
  rango_via: '',
  cargo_via: '',
  lugar_actividad: '',
  cantidad_iglesias: '',
  nombre_diacono: '',
  nombre_secretaria: '',
  identificacion_firmante: ''
}
export const PERMISSION_FIELDS = [
  {
    key: 'identificacion_firmante',
    label: 'Cédula del firmante (opcional)',
    placeholder: 'Solo si la institución la requiere',
    police: true
  },
  {
    key: 'fecha_carta',
    label: 'Fecha de la carta',
    placeholder: '26 de octubre de 2026'
  },
  {
    key: 'entidad_permiso',
    label: 'Institución destinataria',
    placeholder: 'Cooperativa de Manoguayabo'
  },
  {
    key: 'direccion_destinatario',
    label: 'Dirección de la institución',
    placeholder: 'Manoguayabo, Santo Domingo Oeste'
  },
  {
    key: 'anos_servicio',
    label: 'Años de servicio en la comunidad',
    placeholder: '25',
    cooperative: true
  },
  {
    key: 'lugar_emision',
    label: 'Lugar de emisión',
    placeholder: 'Manoguayabo, Santo Domingo Oeste'
  },
  {
    key: 'nombre_autoridad',
    label: 'Nombre de la autoridad',
    placeholder: 'Nombre del funcionario actual',
    police: true
  },
  {
    key: 'rango_autoridad',
    label: 'Rango o tratamiento',
    placeholder: 'Coronel, P. N.',
    police: true
  },
  {
    key: 'cargo_autoridad',
    label: 'Cargo de la autoridad',
    placeholder: 'Comandante del destacamento',
    police: true
  },
  {
    key: 'nombre_via',
    label: 'Nombre de la autoridad por vía',
    placeholder: 'Nombre del funcionario actual',
    general: true
  },
  {
    key: 'rango_via',
    label: 'Rango de la autoridad por vía',
    placeholder: 'Coronel, P. N.',
    general: true
  },
  {
    key: 'cargo_via',
    label: 'Cargo de la autoridad por vía',
    placeholder: 'Director regional de la Policía Nacional',
    general: true
  },
  {
    key: 'espacio_solicitado',
    label: 'Espacio o instalación solicitada',
    placeholder: 'Área del parqueo'
  },
  {
    key: 'lugar_actividad',
    label: 'Lugar de la actividad',
    placeholder: 'Destacamento de Manoguayabo',
    police: true
  },
  {
    key: 'tipo_evento',
    label: 'Tipo de actividad',
    placeholder: 'Actividad cristiana para jóvenes'
  },
  { key: 'dia_actividad', label: 'Día de la actividad', placeholder: 'Sábado' },
  {
    key: 'fecha_actividad',
    label: 'Fecha de la actividad',
    placeholder: '12 de diciembre de 2026'
  },
  {
    key: 'hora_actividad',
    label: 'Hora de la actividad',
    placeholder: '2:00 P. M.'
  },
  { key: 'tema_evento', label: 'Tema o lema', placeholder: 'Noche de Gloria' },
  {
    key: 'finalidad_actividad',
    label: 'Finalidad y público de la actividad',
    placeholder: 'Llevar la palabra de Dios a los jóvenes de nuestra comunidad'
  },
  {
    key: 'cantidad_iglesias',
    label: 'Cantidad de iglesias participantes',
    placeholder: '15',
    police: true
  },
  {
    key: 'nombre_diacono',
    label: 'Nombre del diácono (opcional)',
    placeholder: 'Nombre del firmante',
    police: true
  },
  {
    key: 'nombre_secretaria',
    label: 'Nombre de la secretaria (opcional)',
    placeholder: 'Nombre de la firmante',
    police: true
  }
]
export const COOPERATIVE_TEMPLATE = `Señores:
Administradores de {{entidad_permiso}}
{{direccion_destinatario}}

Distinguidos señores:

Quien suscribe, {{titulo_pastor}} {{nombre_pastor}}, de la iglesia {{nombre_iglesia}}, con {{anos_servicio}} años de servicio en nuestra comunidad, «Buscando las Almas para Jesucristo», por este medio les solicita muy respetuosamente parte de sus instalaciones, específicamente {{espacio_solicitado}}, para el {{dia_actividad}} {{fecha_actividad}}, a las {{hora_actividad}}, para realizar {{tipo_evento}}, con la finalidad de {{finalidad_actividad}}, bajo el lema «{{tema_evento}}».

En {{lugar_emision}}, a {{fecha_carta}}.`
const POLICE_OPENING = `{{lugar_emision}}

{{nombre_autoridad}}
{{rango_autoridad}}
{{cargo_autoridad}}
{{entidad_permiso}}
{{direccion_destinatario}}`
const POLICE_BODY = `Luego de extenderle un afectuoso saludo en la paz de nuestro Señor Jesucristo y felicitarle por la labor que desempeña con gran responsabilidad.

La presente comunicación es para solicitar su autorización para realizar {{tipo_evento}} y utilizar {{espacio_solicitado}} en {{lugar_actividad}}, donde no se perturbará a los transeúntes ni a los ciudadanos que acuden al lugar.

Garantizamos el orden y la prudencia en dicha actividad, cuya finalidad es {{finalidad_actividad}}.

Los pastores de este sector nos sentimos satisfechos con el trabajo que ha estado realizando el comandante de este destacamento con nuestra juventud. Deseamos continuar trabajando a favor de nuestra comunidad, en colaboración con esta prestigiosa institución que es la Policía Nacional.

En dicha actividad participarán {{cantidad_iglesias}} iglesias de la comunidad. Está prevista para el {{dia_actividad}} {{fecha_actividad}}, a las {{hora_actividad}}, y se desarrollará bajo el tema «{{tema_evento}}».

Se despide atentamente y en espera de su respuesta,`
export const POLICE_TEMPLATE = POLICE_OPENING + '\n\n' + POLICE_BODY
export const POLICE_GENERAL_TEMPLATE =
  POLICE_OPENING +
  `

Vía:
{{nombre_via}}
{{rango_via}}
{{cargo_via}}

` +
  POLICE_BODY
