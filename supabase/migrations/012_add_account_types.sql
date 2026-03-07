-- Add new account types
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'awb';
ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'other';
