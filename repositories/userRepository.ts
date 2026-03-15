export async function findUserByEmail(email: string, tx: any) {
  return tx.user.findUnique({
    where: { email },
  });
}
