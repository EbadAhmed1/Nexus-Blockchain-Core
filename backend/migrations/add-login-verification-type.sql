-- Add 'login_verification' type to email_verifications table
-- This allows login verification codes to be stored

-- First, drop the existing check constraint
ALTER TABLE email_verifications 
DROP CONSTRAINT IF EXISTS email_verifications_type_check;

-- Add the new constraint with login_verification included
ALTER TABLE email_verifications 
ADD CONSTRAINT email_verifications_type_check 
CHECK (type IN ('signup', 'transaction', 'password_reset', 'account_deletion', 'p2p_request', 'login_verification'));

