import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export interface ContactMessage {
  id?: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  wallet_address?: string | null;
  created_at?: string;
  read?: boolean;
}
export const contactAPI = {
  async create(data: Omit<ContactMessage, 'id' | 'created_at' | 'read'>) {
    const { data: result, error } = await supabase
      .from('contact_messages')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async getAll(unreadOnly: boolean = false) {
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async markAsRead(id: number) {
    const { error } = await supabase
      .from('contact_messages')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: number) {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};