import { ApiError } from "../errors/ApiError.js";

const ALLOWED_TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
}

function canTransition(fromStatus, toStatus) {
  const allowedTransitions = ALLOWED_TRANSITIONS[fromStatus];
  return allowedTransitions && allowedTransitions.includes(toStatus);
}

function assertValidTransition(fromStatus, toStatus) {
  if (!canTransition(fromStatus, toStatus)) {
    throw new ApiError(400, `Invalid transition from ${fromStatus} to ${toStatus}`);
  }
}

export { assertValidTransition };