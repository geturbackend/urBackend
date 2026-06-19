export const ONBOARDING_STEPS = [
    {
        key: 'create_project',
        title: 'Create Project',
        description: 'Create the backend container for your data, auth, storage, and API settings.',
        getPath: () => '/create-project'
    },
    {
        key: 'create_collection',
        title: 'Create Collection',
        description: 'Add the first collection that defines how your backend stores data.',
        getPath: ({ projectId }) => projectId ? `/project/${projectId}/create-collection` : '/dashboard'
    },
    {
        key: 'get_api_key',
        title: 'Reveal API Keys',
        description: 'Verify your email to reveal live API keys and unlock production requests.',
        getPath: ({ projectId }) => projectId ? `/project/${projectId}` : '/dashboard'
    },
    {
        key: 'make_api_call',
        title: 'Make your first API call',
        description: 'Connect your app to urBackend.',
        getPath: () => '/docs'
    }
];
