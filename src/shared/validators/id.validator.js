import { ApiError } from "../errors/ApiError.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const validateId = (id) => {
  if (!UUID_REGEX.test(id)) {
    throw new ApiError(400, 'Invalid id');
  }
  return true;
};

export { validateId };