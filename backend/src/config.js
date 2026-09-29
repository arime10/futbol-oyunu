import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  HOST_USERNAME: process.env.HOST_USERNAME || 'yuED10',
  PORT: process.env.PORT || 4000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DEFAULT_INVITE_CODE: process.env.DEFAULT_INVITE_CODE || 'FUT2026'
};
