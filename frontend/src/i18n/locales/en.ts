/**
 * English translations — the default locale.
 *
 * This file is also the source of truth for the shape of every translation
 * file. New locales should mirror these keys; missing keys fall back here.
 *
 * Interpolation: use `{name}` placeholders in strings, then pass values via
 * the `vars` argument of `t()` — for example `t('header.greeting', { name })`.
 *
 * Pluralization: define both `myKey_one` and `myKey_other`. When `vars.count`
 * is provided, `t()` automatically picks the right variant.
 */
const messages = {
  common: {
    loading: 'Loading…',
    cancel: 'Cancel',
    error: 'Error',
  },

  header: {
    greeting: 'Hi, {name}',
    logout: 'Log out',
    languageLabel: 'Language',
  },

  languages: {
    en: 'English',
    es: 'Español',
  },

  auth: {
    heroTitle: 'Share expenses without complications.',
    heroSub: "Record what each person paid and instantly see who owes whom.",
    heroTitleInvite: 'You were invited to a group.',
    heroSubInvite: 'Sign in or create an account to join the group.',
    tabLogin: 'Sign in',
    tabRegister: 'Sign up',
    username: 'Username',
    password: 'Password',
    usernamePlaceholder: 'e.g. maria',
    passwordPlaceholder: '••••••••',
    chooseUsernamePlaceholder: 'Choose a username',
    choosePasswordPlaceholder: 'Choose a password',
    submitLogin: 'Log in →',
    submitRegister: 'Create account →',
    loginErrorFallback: 'Login failed',
    registerErrorFallback: 'Registration failed',
  },

  groupsList: {
    heroTitle: 'Your groups.',
    heroSub:
      'Each group is a shared account with your family, your trip or your friends.',
    emptyLine1: "You don't have any groups yet.",
    emptyLine2: 'Tap {plus} to create your first one.',
    fabAria: 'New group',
    newGroupTitle: 'New group',
    nameLabel: 'Group name',
    namePlaceholder: 'e.g. Trip to Cartagena',
    currencyLabel: 'Currency',
    submit: 'Create group',
  },

  groupCard: {
    upToDate: "You're all settled up",
    youAreOwed: "You're owed",
    youOwe: 'You owe',
    members_one: '{count} member',
    members_other: '{count} members',
    expenses_one: '{count} expense',
    expenses_other: '{count} expenses',
  },

  groupDetail: {
    back: '← Groups',
    totalMeta: '{total} in total',
    expenses_one: '{count} expense',
    expenses_other: '{count} expenses',
    invite: 'Invite',
    delete: 'Delete',
    confirmDelete: 'Delete "{name}" and all of its expenses?',
    loading: 'Loading…',
    loadFailed: "Couldn't load the group.",
    fabAria: 'Add expense',
    tabExpenses: 'Expenses',
    tabBalances: 'Balances',
    tabSettle: 'Settle up',
  },

  memberChips: {
    removeTitle: 'Remove',
    confirmRemove: 'Remove this member?',
    addBtn: '+ Add member',
    removeFailed: "Couldn't remove the member",
  },

  newExpense: {
    title: 'New expense',
    description: 'Description',
    descriptionPlaceholder: 'e.g. Dinner',
    amount: 'Amount',
    currency: 'Currency',
    paidBy: 'Paid by',
    category: 'Category',
    splitBetween: 'Split between',
    save: 'Save expense',
    fxHint: '≈ {amount} in the group currency',
    selectMember: 'Select at least one member',
    amountInvalid: 'Amount must be greater than 0',
    saveFailed: "Couldn't save the expense",
  },

  categories: {
    Mercado: 'Groceries',
    Comida: 'Food',
    Transporte: 'Transport',
    Hospedaje: 'Lodging',
    Servicios: 'Utilities',
    Salud: 'Health',
    Ocio: 'Leisure',
    Otros: 'Other',
  },

  addMember: {
    title: 'Add member',
    name: 'Name',
    namePlaceholder: 'e.g. Juan',
    hint: "They don't need an account in the app.",
    submit: 'Add',
  },

  invite: {
    title: 'Invite to the group',
    info: 'Share this link. Anyone who opens it and signs up automatically joins {group}.',
    linkLabel: 'Invite link',
    copy: 'Copy link',
    whatsapp: 'WhatsApp',
    copied: '✓ Link copied',
    whatsappMessage: 'I invite you to "{group}" on finfam: {link}',
  },

  expenses: {
    historyLabel: 'History',
    empty: 'No expenses yet. Tap {plus} to add one.',
    noDescription: '(no description)',
    paidByMeta: '{payer} paid · {category} · {split} · {date}',
    notSplit: 'not split',
    splitBetween: 'split between {count}',
    somebody: 'Someone',
    deleteAria: 'Delete',
  },

  balances: {
    title: 'Balance per member',
  },

  settlements: {
    title: 'To settle everything',
    empty: 'Everyone is up to date. Nobody owes anything!',
  },

  join: {
    joining: 'Joining the group…',
  },

  modal: {
    closeAria: 'Close',
  },

  currencies: {
    COP: 'Colombian peso',
    USD: 'US dollar',
    EUR: 'Euro',
    MXN: 'Mexican peso',
    ARS: 'Argentine peso',
    BRL: 'Brazilian real',
    CLP: 'Chilean peso',
    PEN: 'Peruvian sol',
  },
} as const;

export default messages;
export type Messages = typeof messages;
