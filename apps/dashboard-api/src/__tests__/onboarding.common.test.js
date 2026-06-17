'use strict';

jest.mock('../../../../packages/common/src/models/Developer', () => ({
  findById: jest.fn(),
}));

const Developer = require('../../../../packages/common/src/models/Developer');
const {
  markDeveloperOnboardingStep,
  updateDeveloperOnboarding,
} = require('../../../../packages/common/src/utils/onboarding');

const setByPath = (target, path, value) => {
  const parts = path.split('.');
  if (parts.some((part) => part === '__proto__' || part === 'constructor' || part === 'prototype')) {
    return;
  }
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    cursor[parts[i]] = cursor[parts[i]] || {};
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
};

const makeDeveloper = (onboarding = {}) => ({
  onboarding: {
    completed: false,
    steps: {
      projectCreated: false,
      collectionCreated: false,
      firstApiCall: false,
      ...(onboarding.steps || {}),
    },
    activationAt: onboarding.activationAt || null,
    ...onboarding,
  },
  set: jest.fn(function(path, value) {
    setByPath(this, path, value);
  }),
  save: jest.fn().mockResolvedValue(undefined),
});

describe('common onboarding sequencing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows the next sequential step', async () => {
    const developer = makeDeveloper();
    Developer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(developer) });

    const onboarding = await updateDeveloperOnboarding('dev_1', {
      steps: { projectCreated: true },
    });

    expect(developer.set).toHaveBeenCalledWith('onboarding.steps.projectCreated', true);
    expect(developer.save).toHaveBeenCalled();
    expect(onboarding.steps.projectCreated).toBe(true);
    expect(onboarding.completed).toBe(false);
  });

  test('rejects skipped steps', async () => {
    const developer = makeDeveloper();
    Developer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(developer) });

    await expect(updateDeveloperOnboarding('dev_1', {
      steps: { collectionCreated: true },
    })).rejects.toMatchObject({
      message: 'Complete projectCreated before collectionCreated.',
      statusCode: 409,
    });

    expect(developer.save).not.toHaveBeenCalled();
  });

  test('allows forced completion (skip flow)', async () => {
    const developer = makeDeveloper({ steps: { projectCreated: true } });
    Developer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(developer) });

    // completed:true is now allowed even if steps are incomplete — user chose to skip
    const onboarding = await updateDeveloperOnboarding('dev_1', {
      completed: true,
    });

    expect(onboarding).toBeTruthy();
    expect(developer.save).toHaveBeenCalled();
  });

  test('rejects reset attempts', async () => {
    const developer = makeDeveloper({ steps: { projectCreated: true } });
    Developer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(developer) });

    await expect(updateDeveloperOnboarding('dev_1', {
      steps: { projectCreated: false },
    })).rejects.toMatchObject({
      message: 'Onboarding progress cannot be reset.',
      statusCode: 409,
    });
  });

  test('rejects mutation after completion', async () => {
    const developer = makeDeveloper({
      completed: true,
      steps: { projectCreated: true, collectionCreated: true, firstApiCall: true },
    });
    Developer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(developer) });

    await expect(updateDeveloperOnboarding('dev_1', {
      steps: { projectCreated: true },
    })).rejects.toMatchObject({
      message: 'Onboarding is already completed.',
      statusCode: 409,
    });
  });

  test('automatic first API call marker also enforces prerequisites', async () => {
    const developer = makeDeveloper({ steps: { projectCreated: true } });
    Developer.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(developer) });

    await expect(markDeveloperOnboardingStep('dev_1', 'firstApiCall')).rejects.toMatchObject({
      message: 'Complete collectionCreated before firstApiCall.',
      statusCode: 409,
    });
  });
});
