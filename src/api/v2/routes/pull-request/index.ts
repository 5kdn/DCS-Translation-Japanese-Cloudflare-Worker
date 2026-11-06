import { createPullRequest } from './create';
import { getPullRequest } from './get';
import { listPullRequests } from './list';

export const pullRequestRoutes = {
  listPullRequests,
  createPullRequest,
  getPullRequest,
};
