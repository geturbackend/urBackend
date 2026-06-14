const Developer = require('../models/Developer');

const ONBOARDING_STEP_FIELDS = {
  projectCreated: 'onboarding.steps.projectCreated',
  collectionCreated: 'onboarding.steps.collectionCreated',
  firstApiCall: 'onboarding.steps.firstApiCall',
};

const normalizeOnboarding = (onboarding = {}) => {
  const steps = onboarding.steps || {};
  const normalized = {
    completed: Boolean(onboarding.completed),
    steps: {
      projectCreated: Boolean(steps.projectCreated),
      collectionCreated: Boolean(steps.collectionCreated),
      firstApiCall: Boolean(steps.firstApiCall),
    },
    activationAt: onboarding.activationAt || null,
  };

  normalized.completed =
    normalized.steps.projectCreated &&
    normalized.steps.collectionCreated &&
    normalized.steps.firstApiCall;

  return normalized;
};

const markDeveloperOnboardingStep = async (developerId, step, options = {}) => {
  const stepPath = ONBOARDING_STEP_FIELDS[step];
  if (!developerId || !stepPath) return null;

  await Developer.updateOne(
    { _id: developerId },
    { $set: { [stepPath]: true } },
    { runValidators: true }
  );

  if (step === 'firstApiCall') {
    await Developer.updateOne(
      { _id: developerId, 'onboarding.activationAt': null },
      { $set: { 'onboarding.activationAt': options.activationAt || new Date() } },
      { runValidators: true }
    );
  }

  const developer = await Developer.findById(developerId).select('onboarding');

  if (!developer) return null;

  const onboarding = normalizeOnboarding(developer.onboarding);
  if (developer.onboarding?.completed !== onboarding.completed) {
    developer.onboarding.completed = onboarding.completed;
    await developer.save();
  }

  return onboarding;
};

module.exports = {
  ONBOARDING_STEP_FIELDS,
  markDeveloperOnboardingStep,
  normalizeOnboarding,
};
