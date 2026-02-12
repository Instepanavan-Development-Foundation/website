export default {
  routes: [
    {
      method: 'GET',
      path: '/projects/:documentId/funding',
      handler: 'project.getProjectFunding',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/projects/:documentId/donor-count',
      handler: 'project.getDonorCount',
      config: {
        auth: false,
      },
    },
  ],
};
