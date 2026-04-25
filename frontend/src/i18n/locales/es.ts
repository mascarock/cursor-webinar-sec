import type { Messages } from './en';

/**
 * Spanish translations.
 *
 * Mirror the shape of `en.ts`. Any missing key here automatically falls
 * back to the English version.
 *
 * The `DeepPartial` type lets you add new keys to `en.ts` without having
 * to translate them all immediately — they will simply use the English
 * fallback until translated.
 */
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const messages: DeepPartial<Messages> = {
  common: {
    loading: 'Cargando…',
    cancel: 'Cancelar',
    error: 'Error',
  },

  header: {
    greeting: 'Hola, {name}',
    logout: 'Salir',
    languageLabel: 'Idioma',
  },

  languages: {
    en: 'English',
    es: 'Español',
  },

  auth: {
    heroTitle: 'Comparte gastos sin complicaciones.',
    heroSub:
      'Registra lo que pagó cada persona y consulta al instante quién le debe a quién.',
    heroTitleInvite: 'Te invitaron a un grupo.',
    heroSubInvite: 'Inicia sesión o crea una cuenta para unirte al grupo.',
    tabLogin: 'Iniciar sesión',
    tabRegister: 'Registrarse',
    username: 'Usuario',
    password: 'Contraseña',
    usernamePlaceholder: 'ej: maria',
    passwordPlaceholder: '••••••••',
    chooseUsernamePlaceholder: 'Elige un nombre de usuario',
    choosePasswordPlaceholder: 'Elige una contraseña',
    submitLogin: 'Entrar →',
    submitRegister: 'Crear cuenta →',
    loginErrorFallback: 'Error al iniciar sesión',
    registerErrorFallback: 'Error al registrarse',
  },

  groupsList: {
    heroTitle: 'Tus grupos.',
    heroSub:
      'Cada grupo es una cuenta compartida con tu familia, tu viaje o tus amigos.',
    emptyLine1: 'Aún no tienes grupos.',
    emptyLine2: 'Pulsa {plus} para crear el primero.',
    fabAria: 'Nuevo grupo',
    newGroupTitle: 'Nuevo grupo',
    nameLabel: 'Nombre del grupo',
    namePlaceholder: 'ej: Viaje a Cartagena',
    currencyLabel: 'Moneda',
    submit: 'Crear grupo',
  },

  groupCard: {
    upToDate: 'Estás al día',
    youAreOwed: 'Te deben',
    youOwe: 'Debes',
    members_one: '{count} miembro',
    members_other: '{count} miembros',
    expenses_one: '{count} gasto',
    expenses_other: '{count} gastos',
  },

  groupDetail: {
    back: '← Grupos',
    totalMeta: '{total} en total',
    expenses_one: '{count} gasto',
    expenses_other: '{count} gastos',
    invite: 'Invitar',
    delete: 'Eliminar',
    confirmDelete: '¿Eliminar "{name}" y todos sus gastos?',
    loading: 'Cargando…',
    loadFailed: 'No se pudo cargar el grupo.',
    fabAria: 'Agregar gasto',
    tabExpenses: 'Gastos',
    tabBalances: 'Balances',
    tabSettle: 'Saldar',
  },

  memberChips: {
    removeTitle: 'Quitar',
    confirmRemove: '¿Quitar a este miembro?',
    addBtn: '+ Agregar miembro',
    removeFailed: 'No se pudo quitar al miembro',
  },

  newExpense: {
    title: 'Nuevo gasto',
    description: 'Descripción',
    descriptionPlaceholder: 'ej: Cena',
    amount: 'Monto',
    currency: 'Moneda',
    paidBy: 'Pagado por',
    category: 'Categoría',
    splitBetween: 'Dividido entre',
    save: 'Guardar gasto',
    fxHint: '≈ {amount} en la moneda del grupo',
    selectMember: 'Seleccioná al menos un miembro',
    amountInvalid: 'El monto debe ser mayor a 0',
    saveFailed: 'No se pudo guardar el gasto',
  },

  categories: {
    Mercado: 'Mercado',
    Comida: 'Comida',
    Transporte: 'Transporte',
    Hospedaje: 'Hospedaje',
    Servicios: 'Servicios',
    Salud: 'Salud',
    Ocio: 'Ocio',
    Otros: 'Otros',
  },

  addMember: {
    title: 'Agregar miembro',
    name: 'Nombre',
    namePlaceholder: 'ej: Juan',
    hint: 'No hace falta que tenga cuenta en la app.',
    submit: 'Agregar',
  },

  invite: {
    title: 'Invitar al grupo',
    info: 'Comparte este enlace. Quien lo abra y se registre se une automáticamente a {group}.',
    linkLabel: 'Link de invitación',
    copy: 'Copiar enlace',
    whatsapp: 'WhatsApp',
    copied: '✓ Link copiado',
    whatsappMessage: 'Te invito a "{group}" en finfam: {link}',
  },

  expenses: {
    historyLabel: 'Historial',
    empty: 'Aún no hay gastos. Pulsa {plus} para agregar uno.',
    noDescription: '(sin descripción)',
    paidByMeta: '{payer} pagó · {category} · {split} · {date}',
    notSplit: 'sin dividir',
    splitBetween: 'dividido entre {count}',
    somebody: 'Alguien',
    deleteAria: 'Eliminar',
  },

  balances: {
    title: 'Balance por miembro',
  },

  settlements: {
    title: 'Para saldar todo',
    empty: 'Todos están al día. ¡Nadie le debe nada a nadie!',
  },

  join: {
    joining: 'Uniéndote al grupo…',
  },

  modal: {
    closeAria: 'Cerrar',
  },

  currencies: {
    COP: 'Peso colombiano',
    USD: 'Dólar',
    EUR: 'Euro',
    MXN: 'Peso mexicano',
    ARS: 'Peso argentino',
    BRL: 'Real brasileño',
    CLP: 'Peso chileno',
    PEN: 'Sol peruano',
  },
};

export default messages;
