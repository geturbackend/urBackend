const Developer = require('../models/Developer');

const ONBOARDING_STEP_FIELDS = {
  projectCreated: 'onboarding.steps.projectCreated',
  collectionCreated: 'onboarding.steps.collectionCreated',
  firstApiCall: 'onboarding.steps.firstApiCall',
};

const ONBOARDING_STEP_ORDER = ['projectCreated', 'collectionCreated', 'firstApiCall'];

const ONBOARDING_STEP_PREREQUISITES = {
  projectCreated: [],
  collectionCreated: ['projectCreated'],
  firstApiCall: ['projectCreated', 'collectionCreated'],
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
    Boolean(onboarding.completed) ||
    (
      normalized.steps.projectCreated &&
      normalized.steps.collectionCreated &&
      normalized.steps.firstApiCall
    );

  return normalized;
};

const buildCompletionFromSteps = (steps) =>
  Boolean(
    steps.projectCreated &&
    steps.collectionCreated &&
    steps.firstApiCall
  );

const assertCanSetStep = (currentOnboarding, step) => {
  const prerequisites = ONBOARDING_STEP_PREREQUISITES[step];
  if (!prerequisites) {
    const err = new Error('Invalid onboarding step.');
    err.statusCode = 400;
    throw err;
  }

  const steps = normalizeOnboarding(currentOnboarding).steps;
  const missing = prerequisites.find((requiredStep) => !steps[requiredStep]);
  if (missing) {
    const err = new Error(`Complete ${missing} before ${step}.`);
    err.statusCode = 409;
    throw err;
  }
};

const getRequestedTrueSteps = (payloadSteps = {}) =>
  ONBOARDING_STEP_ORDER.filter((step) => payloadSteps[step] === true);

const getRequestedFalseSteps = (payloadSteps = {}) =>
  ONBOARDING_STEP_ORDER.filter((step) => payloadSteps[step] === false);

const markDeveloperOnboardingStep = async (developerId, step, options = {}) => {
  const stepPath = ONBOARDING_STEP_FIELDS[step];
  if (!developerId || !stepPath) return null;

  const developer = await Developer.findById(developerId).select('onboarding');
  if (!developer) return null;

  const current = normalizeOnboarding(developer.onboarding);
  if (current.completed) return current;
  if (!current.steps[step]) {
    assertCanSetStep(developer.onboarding, step);
    developer.set(stepPath, true);
  }

  if (step === 'firstApiCall') {
    const currentActivationAt = developer.onboarding?.activationAt || null;
    if (!currentActivationAt) {
      developer.set('onboarding.activationAt', options.activationAt || new Date());
    }
  }

  const onboarding = normalizeOnboarding(developer.onboarding);
  developer.onboarding.completed = onboarding.completed;
  await developer.save();

  return onboarding;
};

const updateDeveloperOnboarding = async (developerId, payload = {}) => {
  if (!developerId) return null;

  const developer = await Developer.findById(developerId).select('onboarding');
  if (!developer) return null;

  const current = normalizeOnboarding(developer.onboarding);
  if (current.completed) {
    const err = new Error('Onboarding is already completed.');
    err.statusCode = 409;
    throw err;
  }

  const falseSteps = getRequestedFalseSteps(payload.steps);
  if (falseSteps.length > 0 || payload.completed === false) {
    const err = new Error('Onboarding progress cannot be reset.');
    err.statusCode = 409;
    throw err;
  }

  const trueSteps = getRequestedTrueSteps(payload.steps);
  for (const step of trueSteps) {
    if (!normalizeOnboarding(developer.onboarding).steps[step]) {
      assertCanSetStep(developer.onboarding, step);
      developer.set(ONBOARDING_STEP_FIELDS[step], true);
    }
  }

  const onboarding = normalizeOnboarding(developer.onboarding);

  if (payload.completed === true && !onboarding.completed) {
    const err = new Error('Complete all onboarding steps before marking onboarding complete.');
    err.statusCode = 409;
    throw err;
  }

  developer.onboarding.completed = onboarding.completed;
  await developer.save();

  return onboarding;
};

const markDeveloperActivated = async (developerId, options = {}) => {
  if (!developerId) return { onboarding: null, activated: false };

  const activationAt = options.activationAt || new Date();
  const onboarding = await markDeveloperOnboardingStep(developerId, 'firstApiCall', { activationAt });

  if (!onboarding) return { onboarding: null, activated: false };

  return { onboarding, activated: onboarding.completed };
};

module.exports = {
  ONBOARDING_STEP_FIELDS,
  ONBOARDING_STEP_ORDER,
  markDeveloperOnboardingStep,
  markDeveloperActivated,
  normalizeOnboarding,
  updateDeveloperOnboarding,
};
