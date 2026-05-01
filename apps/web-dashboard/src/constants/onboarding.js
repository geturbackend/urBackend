export const ONBOARDING_STEPS = [
    {
        key: 'create_project',
        title: 'Create your first project',
        description: 'Start by creating a workspace for your data.',
        getPath: () => '/create-project'
    },
    {
        key: 'create_collection',
        title: 'Create a collection',
        description: 'Define your data schema and collections.',
        getPath: ({ projectId }) => projectId ? `/project/${projectId}/create-collection` : '/dashboard'
    },
    {
        key: 'get_api_key',
        title: 'Get your API Key',
        description: 'Access your project via the Public API.',
        getPath: ({ projectId }) => projectId ? `/project/${projectId}` : '/dashboard'
    },
    {
        key: 'make_api_call',
        title: 'Make your first API call',
        description: 'Connect your app to urBackend.',
        getPath: () => '/docs'
    }
];
