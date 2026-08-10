export function toSafeUser(user) {
  const { password, ...safeUser } = user.toJSON();
  return safeUser;
}