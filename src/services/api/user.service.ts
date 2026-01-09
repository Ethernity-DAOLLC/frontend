// src/services/api/user.service.ts

import { apiClient } from './base.client';
import { API_ENDPOINTS } from '../../config/api.config';

/**
 * User Types
 */
export interface UserCreate {
  wallet_address: string;
  email?: string;
  ip_address?: string;
  user_agent?: string;
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
}

export interface EmailAssociation {
  address: string;
  email: string;
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
}

export interface UserResponse {
  id: number;
  wallet_address: string;
  email?: string;
  email_verified: boolean;
  accepts_marketing: boolean;
  accepts_notifications: boolean;
  created_at: string;
  last_login?: string;
}

export interface UserAdmin extends UserResponse {
  ip_address?: string;
  user_agent?: string;
  updated_at?: string;
}

export interface UserUpdate {
  email?: string;
  email_verified?: boolean;
  accepts_marketing?: boolean;
  accepts_notifications?: boolean;
}

/**
 * User Service
 * Maneja todos los endpoints relacionados con usuarios
 */
export const userService = {
  /**
   * Registrar nuevo usuario
   * @param data - Datos del usuario a crear
   * @returns Usuario creado
   * 
   * @example
   * const user = await userService.register({
   *   wallet_address: '0x123...',
   *   email: 'user@example.com',
   *   accepts_marketing: true
   * });
   */
  async register(data: UserCreate): Promise<UserResponse> {
    return apiClient.post<UserResponse>(
      API_ENDPOINTS.USERS.REGISTER,
      data
    );
  },

  /**
   * Asociar email con wallet
   * @param data - Dirección de wallet y email
   * @returns Usuario actualizado
   * 
   * @example
   * const user = await userService.associateEmail({
   *   address: '0x123...',
   *   email: 'user@example.com',
   *   accepts_marketing: true,
   *   accepts_notifications: true
   * });
   */
  async associateEmail(data: EmailAssociation): Promise<UserResponse> {
    return apiClient.post<UserResponse>(
      API_ENDPOINTS.USERS.EMAIL,
      data
    );
  },

  /**
   * Obtener usuario por wallet address
   * @param walletAddress - Dirección de la wallet
   * @returns Datos del usuario
   * @throws {ApiError} 404 si el usuario no existe
   * 
   * @example
   * const user = await userService.getByWallet('0x123...');
   */
  async getByWallet(walletAddress: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(
      API_ENDPOINTS.USERS.WALLET(walletAddress)
    );
  },

  /**
   * Actualizar último login del usuario
   * Crea el usuario si no existe
   * @param walletAddress - Dirección de la wallet
   * @returns Usuario actualizado o creado
   * 
   * @example
   * const user = await userService.updateLogin('0x123...');
   */
  async updateLogin(walletAddress: string): Promise<UserResponse> {
    return apiClient.post<UserResponse>(
      API_ENDPOINTS.USERS.LOGIN(walletAddress)
    );
  },

  /**
   * Obtener todos los usuarios (Admin)
   * @requires Authentication
   * @param skip - Número de registros a saltar (paginación)
   * @param limit - Número máximo de registros a retornar
   * @returns Lista de usuarios con información administrativa
   * 
   * @example
   * const users = await userService.getAllUsers(0, 50);
   */
  async getAllUsers(
    skip: number = 0,
    limit: number = 100
  ): Promise<UserAdmin[]> {
    return apiClient.get<UserAdmin[]>(
      API_ENDPOINTS.USERS.BASE,
      { skip, limit }
    );
  },

  /**
   * Obtener mailing list (Admin)
   * @requires Authentication
   * @param acceptsMarketing - Filtrar por usuarios que aceptan marketing
   * @param emailVerified - Filtrar por emails verificados
   * @returns Lista de usuarios para mailing
   * 
   * @example
   * // Obtener todos los usuarios con email verificado que aceptan marketing
   * const mailingList = await userService.getMailingList(true, true);
   */
  async getMailingList(
    acceptsMarketing: boolean = true,
    emailVerified: boolean = false
  ): Promise<UserAdmin[]> {
    return apiClient.get<UserAdmin[]>(
      API_ENDPOINTS.USERS.MAILING_LIST,
      { 
        accepts_marketing: acceptsMarketing, 
        email_verified: emailVerified 
      }
    );
  },

  /**
   * Buscar usuarios (Admin)
   * @requires Authentication
   * @param query - Término de búsqueda (busca en wallet, email, etc.)
   * @param skip - Número de registros a saltar
   * @param limit - Número máximo de registros a retornar
   * @returns Lista de usuarios que coinciden con la búsqueda
   * 
   * @example
   * const results = await userService.searchUsers('0x123', 0, 20);
   */
  async searchUsers(
    query: string,
    skip: number = 0,
    limit: number = 50
  ): Promise<UserAdmin[]> {
    return apiClient.get<UserAdmin[]>(
      API_ENDPOINTS.USERS.SEARCH,
      { q: query, skip, limit }
    );
  },

  /**
   * Actualizar usuario (Admin)
   * @requires Authentication
   * @param userId - ID del usuario a actualizar
   * @param data - Datos a actualizar
   * @returns Usuario actualizado
   * @throws {ApiError} 404 si el usuario no existe
   * 
   * @example
   * const updated = await userService.updateUser(1, {
   *   email_verified: true,
   *   accepts_marketing: false
   * });
   */
  async updateUser(
    userId: number,
    data: UserUpdate
  ): Promise<UserAdmin> {
    return apiClient.patch<UserAdmin>(
      API_ENDPOINTS.USERS.BY_ID(userId),
      data
    );
  },

  /**
   * Verificar si una wallet está registrada
   * @param walletAddress - Dirección de la wallet a verificar
   * @returns true si existe, false si no
   * 
   * @example
   * const exists = await userService.walletExists('0x123...');
   * if (exists) {
   *   console.log('Usuario ya registrado');
   * }
   */
  async walletExists(walletAddress: string): Promise<boolean> {
    try {
      await this.getByWallet(walletAddress);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtener o crear usuario por wallet
   * Útil para login automático
   * @param walletAddress - Dirección de la wallet
   * @returns Usuario existente o recién creado
   * 
   * @example
   * // Al conectar wallet, obtener o crear usuario
   * const user = await userService.getOrCreate('0x123...');
   */
  async getOrCreate(walletAddress: string): Promise<UserResponse> {
    try {
      return await this.getByWallet(walletAddress);
    } catch (error) {
      // Si no existe, crearlo
      return await this.register({ wallet_address: walletAddress });
    }
  },

  /**
   * Contar usuarios totales (Admin)
   * @requires Authentication
   * @returns Número total de usuarios registrados
   * 
   * @example
   * const total = await userService.getTotalCount();
   * console.log(`Total usuarios: ${total}`);
   */
  async getTotalCount(): Promise<number> {
    const users = await this.getAllUsers(0, 1);
    // El backend debería tener un endpoint específico para esto
    // Por ahora, obtener todos y contar
    const allUsers = await this.getAllUsers(0, 10000);
    return allUsers.length;
  },

  /**
   * Exportar mailing list a CSV (Admin)
   * @requires Authentication
   * @param acceptsMarketing - Filtrar por usuarios que aceptan marketing
   * @returns String en formato CSV
   * 
   * @example
   * const csv = await userService.exportMailingListCSV(true);
   * // Descargar archivo
   * const blob = new Blob([csv], { type: 'text/csv' });
   * const url = window.URL.createObjectURL(blob);
   * const a = document.createElement('a');
   * a.href = url;
   * a.download = 'mailing-list.csv';
   * a.click();
   */
  async exportMailingListCSV(acceptsMarketing: boolean = true): Promise<string> {
    const users = await this.getMailingList(acceptsMarketing, false);
    
    const headers = ['Email', 'Wallet Address', 'Created At', 'Email Verified'];
    const rows = users.map(user => [
      user.email || '',
      user.wallet_address,
      user.created_at,
      user.email_verified ? 'Yes' : 'No'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  },
};

export default userService;