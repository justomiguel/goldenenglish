import type { EventRegisterSeatPickerLabels } from "@/components/organisms/EventRegisterSeatPicker";
import type { EventRegisterCompanionsLabels } from "@/components/organisms/EventRegisterMultiTicketSection";
import type { EventRegisterMinorTicketsLabels } from "@/components/organisms/EventRegisterMinorTicketsField";

export interface EventRegisterFormLabels {
  participantSection: string;
  steps: {
    who: string;
    whoLead: string;
    tickets: string;
    ticketsLead: string;
    amount: string;
    amountLead: string;
    pay: string;
    payLead: string;
    confirm: string;
    confirmLead: string;
  };
  flowQuestion: string;
  free: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string;
  submit: string;
  consent: string;
  familyDiscount: string;
  familyDiscountPay: string;
  discountCode: {
    label: string;
    placeholder: string;
    apply: string;
    clear: string;
    pay: string;
    invalid: string;
    noUses: string;
    conflict: string;
    coveredOne: string;
    coveredMany: string;
    extraOne: string;
    extraMany: string;
    off: string;
  };
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
  transferSource: {
    questionFallback: string;
    chooseSource: string;
    optionRequired: string;
    sourceRequired: string;
    globalAccount: string;
  };
  seatMap?: EventRegisterSeatPickerLabels;
  companions?: EventRegisterCompanionsLabels;
  minorTickets?: EventRegisterMinorTicketsLabels;
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
