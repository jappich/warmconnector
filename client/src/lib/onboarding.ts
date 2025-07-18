import { apiRequest } from "./queryClient";

interface OnboardingFormData {
  domain: string;
  allowAll: boolean;
  confirmed: boolean;
}

export async function submitOnboardingRequest(data: OnboardingFormData): Promise<void> {
  await apiRequest('POST', '/api/onboarding', data);
}
