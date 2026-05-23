import { apiRequest, authorizedRequest } from '../../api/http';

export function getSubscriptionPlans() {
  return apiRequest('/api/subscription-plans');
}

export function getMySubscriptions(session) {
  return authorizedRequest('/api/subscriptions/me', session);
}

export function createSubscriptionCheckout(session, planId) {
  const origin = window.location.origin;

  return authorizedRequest('/api/subscriptions/checkout', session, {
    method: 'POST',
    body: JSON.stringify({
      planId,
      returnUrl: `${origin}/payment/success`,
      cancelUrl: `${origin}/payment/cancel`,
    }),
  });
}

export function cancelSubscription(session) {
  return authorizedRequest('/api/subscriptions/cancel', session, {
    method: 'POST',
  });
}

export function parsePlanFeatures(featuresJson) {
  if (!featuresJson) {
    return { mentorReviewLimit: 0, features: [] };
  }

  try {
    const parsed = JSON.parse(featuresJson);
    return {
      mentorReviewLimit: parsed.mentorReviewLimit ?? parsed.MentorReviewLimit ?? 0,
      features: parsed.features ?? parsed.Features ?? [],
    };
  } catch {
    return { mentorReviewLimit: 0, features: [] };
  }
}
