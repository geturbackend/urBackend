export const getPostAuthRedirectPath = (user) => {
  return user?.onboarding?.completed ? '/dashboard' : '/onboarding';
};
