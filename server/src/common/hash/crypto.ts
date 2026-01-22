import * as bcrypt from 'bcrypt';

export const hashingPassword = async (
  password: string,
  salt: number = 10,
): Promise<string> => {
  return await bcrypt.hash(password, salt);
};

export const comparingPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, passwordHash);
};
