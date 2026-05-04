-- Add 'p2p_request' type to email_verifications table
-- This allows P2P transaction requests to show up in notifications

-- First, drop the existing check constraint
ALTER TABLE email_verifications 
DROP CONSTRAINT IF EXISTS email_verifications_type_check;

-- Add the new constraint with p2p_request included
ALTER TABLE email_verifications 
ADD CONSTRAINT email_verifications_type_check 
CHECK (type IN ('signup', 'transaction', 'password_reset', 'account_deletion', 'p2p_request'));

