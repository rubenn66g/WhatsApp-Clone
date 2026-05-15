import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://jlmqjuofjndpzyhxtopp.supabase.co";
const supabasePublishableKey = "sb_publishable_k1KYn1nXJLHUnd1NcxQonA_uEGXvwX0";

export const supabase = createClient(supabaseUrl, supabasePublishableKey)