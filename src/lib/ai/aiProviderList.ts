export type AiProviderListItem = {
  id: string;
  label: string;
  enabled: boolean;
  last4: string | null;
};

export type AiProviderList = {
  providers: AiProviderListItem[];
  conversationProviderId: string | null;
};
