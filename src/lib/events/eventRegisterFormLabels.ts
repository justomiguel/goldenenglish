export interface EventRegisterFormLabels {
  participantSection: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  submit: string;
  consent: string;
  error: string;
  successModal: {
    title: string;
    body: string;
    close: string;
  };
  captchaRequired: string;
  fileUploadProgressSending: string;
  tutor: {
    title: string;
    firstName: string;
    lastName: string;
    dni: string;
    email: string;
    phone: string;
    relationship: string;
  };
  payment: {
    title: string;
    flow: string;
    mercadopago: string;
    transfer: string;
    startFailed: string;
  };
  residency: {
    title: string;
    local: string;
    nonLocal: string;
    localPrice: string;
    nonLocalPrice: string;
  };
  transferReceipt: {
    title: string;
    button: string;
    hint: string;
    noFile: string;
    required: string;
    tooLarge: string;
    invalidType: string;
    uploadFailed: string;
    inputAriaLabel: string;
  };
  transferInstructions: {
    title: string;
  };
  selectPlaceholder: string;
  customFieldFile: {
    fileButton: string;
    imageButton: string;
    noFile: string;
    required: string;
    tooLarge: string;
    invalidType: string;
    uploadFailed: string;
    fileInputAriaLabel: string;
    imageInputAriaLabel: string;
  };
}
