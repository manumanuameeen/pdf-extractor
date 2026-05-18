import type { Router } from 'express';

/**
 * ARCHITECTURE: ROUTE BUILDER CONTRACTS
 * Purpose: Define contracts for route builders to ensure consistent registration patterns.
 */

export interface IRouteBuilder {
  router: Router;
}
