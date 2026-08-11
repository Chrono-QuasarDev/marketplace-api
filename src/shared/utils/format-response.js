export const toSafeUser = (user) => {
  const { password, ...safeUser } = user.toJSON();
  return safeUser;
};