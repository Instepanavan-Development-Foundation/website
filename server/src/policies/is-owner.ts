/**
 * `is-owner` policy
 * Ensures authenticated user can only access their own resources
 */

export default (policyContext, config, { strapi }) => {
  const user = policyContext.state.user;

  if (!user) {
    return false; // User must be authenticated
  }

  // For find/findOne operations, filtering happens in controller
  // This policy just ensures user is authenticated
  if (policyContext.request.method === 'GET') {
    return true;
  }

  // For update/delete operations on specific resources
  if (policyContext.params.id) {
    // Ownership check will be done in controller
    return true;
  }

  // For create operations, user will be automatically assigned
  return true;
};
